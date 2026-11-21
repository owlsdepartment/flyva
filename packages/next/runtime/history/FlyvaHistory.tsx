'use client';

import { applyCssStageClasses, type FlyvaNavigation } from '@flyva/shared';
import { useEffect, useRef } from 'react';

import { createClone, insertClone, transitionState } from '../hooks/internalState';
import { type FlyvaHistoryStrategy, useFlyvaConfig } from '../hooks/useFlyvaConfig';
import { useFlyvaManager } from '../hooks/useFlyvaManager';
import { useFlyvaTransition } from '../hooks/useFlyvaTransition';
import { consumeTraversal, installHistoryTracking } from './historyTracking';

const DEFAULT_INTERCEPT_TIMEOUT_MS = 8000;

let vtWarned = false;

/**
 * Handles browser back / forward for `FlyvaRoot` when `config.history` is set. Rendered by
 * `FlyvaRoot`; not part of the public API.
 */
export function FlyvaHistory() {
	const manager = useFlyvaManager();
	const config = useFlyvaConfig();
	const transition = useFlyvaTransition();

	const live = useRef({ manager, config, transition });
	useEffect(() => {
		live.current = { manager, config, transition };
	});

	useEffect(() => {
		installHistoryTracking();

		let generation = 0;
		let replaying = false;
		let holding = false;
		let releaseGate: (() => void) | null = null;

		const openEnterGate = () => {
			let resolve!: () => void;
			const gate = new Promise<void>(r => {
				resolve = r;
			});
			transitionState.enterGate = gate;
			releaseGate = resolve;
			return resolve;
		};

		const markStarted = () => {
			transitionState.initializedManually = true;
			transitionState.hasTransitioned = true;
		};

		const resolveExplicitKey = (navigation: FlyvaNavigation, fromHref: string, toHref: string) =>
			live.current.config.history?.transition?.({ navigation, fromHref, toHref });

		const resolveKey = async (navigation: FlyvaNavigation, fromHref: string, toHref: string) => {
			const { manager, config } = live.current;
			return (
				resolveExplicitKey(navigation, fromHref, toHref) ??
				(await manager.matchTransitionKey({ fromHref, toHref }, undefined, {
					navigation,
					fallbackKey: config.history?.defaultKey,
				}))
			);
		};

		const cancelRunning = () => {
			generation += 1;
			holding = false;
			releaseGate?.();
			releaseGate = null;
			transitionState.enterGate = null;

			const { manager, transition } = live.current;
			transition.abortConcurrent();
			transitionState.initializedManually = false;
			if (manager.isRunning) manager.finishTransition();
		};

		const runNoop = (
			gen: number,
			navigation: FlyvaNavigation,
			fromHref: string,
			toHref: string,
		) => {
			markStarted();
			const release = openEnterGate();

			void (async () => {
				try {
					const key = await resolveKey(navigation, fromHref, toHref);
					if (gen !== generation) return;
					void live.current.manager.run(key, { fromHref, toHref }, 'history', navigation);
				} finally {
					release();
				}
			})();
		};

		const runSnapshot = (
			gen: number,
			navigation: FlyvaNavigation,
			fromHref: string,
			toHref: string,
		) => {
			const { manager } = live.current;
			const source = manager.currentContent;
			if (!source) {
				runNoop(gen, navigation, fromHref, toHref);
				return;
			}

			const clone = createClone(source);
			const commitSeq = transitionState.commitSeq;
			markStarted();
			const release = openEnterGate();

			void (async () => {
				try {
					const key = await resolveKey(navigation, fromHref, toHref);
					if (gen !== generation) return;

					const ready = manager.run(key, { fromHref, toHref }, 'history', navigation);
					const instance = manager.runningInstance;
					await manager.prepareOutgoing(source, clone);
					if (gen !== generation || manager.runningInstance !== instance) return;

					if (transitionState.commitSeq !== commitSeq) {
						if (process.env.NODE_ENV === 'development') {
							console.warn(
								'[flyva] history snapshot missed the page swap — the leave phase was skipped. ' +
									'Keep `condition`, `history.transition` and `prepareOutgoing` hooks synchronous ' +
									'for the snapshot strategy.',
							);
						}
						return;
					}

					insertClone(source, clone);
					manager.setContentElements(clone);
					if (instance?.concurrent) release();

					await manager.beforeLeave();
					await ready;
					await manager.leave();
					if (instance?.cssMode && manager.runningName) {
						await applyCssStageClasses(clone, String(manager.runningName), 'leave', {
							retainLeaveComputedStyle: true,
						});
					}
					await manager.afterLeave();
				} finally {
					release();
				}
			})();
		};

		const runIntercept = (
			gen: number,
			state: unknown,
			navigation: FlyvaNavigation,
			fromHref: string,
			toHref: string,
		) => {
			holding = true;

			const releaseHeld = () => {
				if (gen !== generation || !holding) return;
				holding = false;

				const commitSeq = transitionState.commitSeq;
				replaying = true;
				try {
					window.dispatchEvent(new PopStateEvent('popstate', { state }));
				} finally {
					replaying = false;
				}

				const timeout =
					live.current.config.history?.interceptTimeout ?? DEFAULT_INTERCEPT_TIMEOUT_MS;
				setTimeout(() => {
					if (gen !== generation || transitionState.commitSeq !== commitSeq) return;
					if (process.env.NODE_ENV === 'development') {
						console.warn(
							'[flyva] history intercept: Next did not swap the page after the popstate was ' +
								'released. The transition was finished without entering.',
						);
					}
					cancelRunning();
				}, timeout);
			};

			void (async () => {
				const { transition } = live.current;
				try {
					await transition.prepare(
						resolveExplicitKey(navigation, fromHref, toHref),
						{ fromHref, toHref },
						undefined,
						navigation,
					);
					if (gen !== generation) return;

					if (transition.isConcurrent) {
						const deferred = await transition.beginConcurrentLeaveForNavigation();
						if (gen !== generation) return;
						releaseHeld();
						if (deferred) await transition.completeConcurrentLeaveAfterNavigation();
					} else {
						await transition.leave();
						releaseHeld();
					}
				} catch (error) {
					releaseHeld();
					throw error;
				}
			})();
		};

		const resolveStrategy = (navigation: FlyvaNavigation): FlyvaHistoryStrategy | false => {
			const strategy = live.current.config.history?.strategy ?? 'noop';
			return typeof strategy === 'function' ? strategy(navigation) : strategy;
		};

		const onPopState = (event: PopStateEvent) => {
			if (replaying) return;

			const { config, manager } = live.current;
			if (!config.history) return;

			if (config.viewTransition) {
				if (process.env.NODE_ENV === 'development' && !vtWarned) {
					vtWarned = true;
					console.warn('[flyva] history handling is not supported together with viewTransition');
				}
				return;
			}

			const { navigation: base, fromHref, toHref, sameDocument } = consumeTraversal(event.state);
			if (sameDocument) return;

			if (holding || manager.isRunning) {
				cancelRunning();
				return;
			}

			const strategy = resolveStrategy(base);
			if (strategy === false) return;

			const navigation: FlyvaNavigation = { ...base, strategy };
			generation += 1;
			const gen = generation;

			if (strategy === 'intercept') {
				event.stopImmediatePropagation();
				runIntercept(gen, event.state, navigation, fromHref, toHref);
			} else if (strategy === 'snapshot') {
				runSnapshot(gen, navigation, fromHref, toHref);
			} else {
				runNoop(gen, navigation, fromHref, toHref);
			}
		};

		window.addEventListener('popstate', onPopState, { capture: true });
		return () => window.removeEventListener('popstate', onPopState, { capture: true });
	}, []);

	return null;
}
