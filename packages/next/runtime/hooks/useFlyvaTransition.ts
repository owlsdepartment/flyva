'use client';

import type { FlyvaNavigation, PageTransitionOptions } from '@flyva/shared';
import {
	applyCssStageClasses,
	applyViewTransitionNames,
	clearViewTransitionNames,
	supportsViewTransitions,
} from '@flyva/shared';

import { createClone, insertClone, transitionState } from './internalState';
import { useFlyvaConfig } from './useFlyvaConfig';
import { useFlyvaManager } from './useFlyvaManager';

let _vtActive = false;

let _domSwapResolve: (() => void) | null = null;

export function resolveDomSwap() {
	_domSwapResolve?.();
	_domSwapResolve = null;
}

export function isVtActive() {
	return _vtActive;
}

function createDomSwapPromise(): Promise<void> {
	return new Promise<void>(resolve => {
		_domSwapResolve = resolve;
	});
}

export function getCapturedClone(): HTMLElement | null {
	const clone = transitionState.capturedClone;
	transitionState.capturedClone = null;
	transitionState.cloneSource = null;
	return clone;
}

export function useFlyvaTransition() {
	const flyvaManager = useFlyvaManager();
	const config = useFlyvaConfig();

	async function prepare(
		transitionKey: string | undefined | null,
		options: PageTransitionOptions,
		el?: Element,
		navigation?: FlyvaNavigation,
	) {
		transitionState.initializedManually = true;
		transitionState.hasTransitioned = true;
		const explicit =
			typeof transitionKey === 'string' && transitionKey.length > 0 ? transitionKey : undefined;
		const resolved =
			explicit ??
			(await flyvaManager.matchTransitionKey(options, el, {
				navigation,
				fallbackKey: navigation ? config.history?.defaultKey : undefined,
			}));
		await flyvaManager.run(resolved, options, el, navigation);

		const instance = flyvaManager.runningInstance;
		const source = flyvaManager.currentContent;
		if (config.viewTransition || !instance?.concurrent || !source) return;

		const clone = createClone(source);

		await flyvaManager.prepareOutgoing(source, clone);
		if (flyvaManager.runningInstance !== instance) return;

		insertClone(source, clone);
	}

	/**
	 * Undoes a concurrent clone swap that has not been handed to the incoming page yet: removes the
	 * clone, shows the live source again and points the manager back at it. Returns whether anything
	 * was restored.
	 */
	function abortConcurrent(): boolean {
		const clone = transitionState.capturedClone;
		const source = transitionState.cloneSource;
		transitionState.capturedClone = null;
		transitionState.cloneSource = null;
		if (!clone || !source) return false;

		source.style.display = '';
		clone.remove();
		flyvaManager.setContentElements(source);
		return true;
	}

	async function leaveWithViewTransition(navigate: () => void): Promise<void> {
		const transition = flyvaManager.runningInstance;
		if (!transition || !supportsViewTransitions()) {
			navigate();
			return;
		}

		_vtActive = true;
		const context = flyvaManager.makeContext();

		let resolvedNames: Record<string, string> | undefined;
		if (transition.viewTransitionNames) {
			resolvedNames = applyViewTransitionNames(transition.viewTransitionNames, context, transition);
		}

		const domSwap = createDomSwapPromise();

		const vt = document.startViewTransition(async () => {
			navigate();
			await domSwap;
			if (resolvedNames) {
				applyViewTransitionNames(resolvedNames, context, transition);
			}
		});

		context.viewTransition = vt;

		if (transition.animateViewTransition) {
			await vt.ready;
			await Promise.resolve(transition.animateViewTransition.call(transition, vt, context));
		}

		await vt.finished;

		if (resolvedNames) clearViewTransitionNames(resolvedNames);
		transition.cleanup?.call(transition, context);
		flyvaManager.finishTransition();
		_vtActive = false;
	}

	async function leaveWithCssMode(): Promise<void> {
		const content = flyvaManager.currentContent;
		if (!content) return;
		const name = flyvaManager.runningName as string;
		const el = content;
		el.style.removeProperty('opacity');
		el.style.removeProperty('transform');
		await applyCssStageClasses(content, name, 'leave', { retainLeaveComputedStyle: true });
	}

	async function enterWithCssMode(): Promise<void> {
		const content = flyvaManager.nextContent ?? flyvaManager.currentContent;
		if (!content) return;
		const name = flyvaManager.runningName as string;
		const el = content;
		el.style.removeProperty('opacity');
		el.style.removeProperty('transform');
		el.style.removeProperty('pointer-events');
		await applyCssStageClasses(content, name, 'enter');
	}

	async function leave() {
		transitionState.initializedManually = true;

		if (flyvaManager.runningInstance?.cssMode && !config.viewTransition) {
			await flyvaManager.beforeLeave();
			await flyvaManager.readyPromise;
			await flyvaManager.leave();
			await leaveWithCssMode();
			await flyvaManager.afterLeave();
			return;
		}

		if (transitionState.capturedClone) {
			flyvaManager.setContentElements(transitionState.capturedClone);
		}

		await flyvaManager.beforeLeave();
		await flyvaManager.readyPromise;
		await flyvaManager.leave();
		await flyvaManager.afterLeave();
	}

	async function beginConcurrentLeaveForNavigation(): Promise<boolean> {
		transitionState.initializedManually = true;

		if (flyvaManager.runningInstance?.cssMode && !config.viewTransition) {
			await leaveWithCssMode();
			return false;
		}

		if (!transitionState.capturedClone || config.viewTransition) {
			await leave();
			return false;
		}

		flyvaManager.setContentElements(transitionState.capturedClone);
		await flyvaManager.beforeLeave();
		await flyvaManager.readyPromise;
		return true;
	}

	async function completeConcurrentLeaveAfterNavigation(): Promise<void> {
		await flyvaManager.leave();
		await flyvaManager.afterLeave();
	}

	async function enter() {
		if (!transitionState.initializedManually) {
			return;
		}

		if (flyvaManager.runningInstance?.cssMode && !config.viewTransition) {
			await flyvaManager.beforeEnter();
			await flyvaManager.readyPromise;
			await flyvaManager.enter();
			await enterWithCssMode();
			await flyvaManager.afterEnter();
			transitionState.initializedManually = false;
			return;
		}

		await flyvaManager.beforeEnter();
		await flyvaManager.readyPromise;
		await flyvaManager.enter();
		await flyvaManager.afterEnter();
		transitionState.initializedManually = false;
	}

	return {
		prepare,
		leave,
		beginConcurrentLeaveForNavigation,
		completeConcurrentLeaveAfterNavigation,
		enter,
		leaveWithViewTransition,
		abortConcurrent,
		get hasTransitioned() {
			return transitionState.hasTransitioned;
		},
		get isConcurrent() {
			return flyvaManager.runningInstance?.concurrent === true;
		},
		get isViewTransition() {
			return !!config.viewTransition;
		},
	};
}
