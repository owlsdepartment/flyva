'use client';

import type { PageTransitionOptions } from '@flyva/shared';
import {
	applyViewTransitionNames,
	clearViewTransitionNames,
	applyCssStageClasses,
	supportsViewTransitions,
} from '@flyva/shared';

import { useFlyvaConfig } from './useFlyvaConfig';
import { useFlyvaManager } from './useFlyvaManager';

let initializedManually = false;
let hasTransitioned = false;
let _capturedClone: HTMLElement | null = null;
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

const CLONE_CSS = '.flyva-clone,.flyva-clone *{animation-play-state:paused!important;transition:none!important}';
let _styleInjected = false;

function injectCloneStyles() {
	if (_styleInjected || typeof document === 'undefined') return;
	const style = document.createElement('style');
	style.textContent = CLONE_CSS;
	document.head.appendChild(style);
	_styleInjected = true;
}

export function getCapturedClone(): HTMLElement | null {
	const clone = _capturedClone;
	_capturedClone = null;
	return clone;
}

export function useFlyvaTransition() {
	const flyvaManager = useFlyvaManager();
	const config = useFlyvaConfig();

	async function prepare(
		transitionKey: string | undefined | null,
		options: PageTransitionOptions,
		el?: Element,
	) {
		initializedManually = true;
		hasTransitioned = true;
		const explicit =
			typeof transitionKey === 'string' && transitionKey.length > 0 ? transitionKey : undefined;
		const resolved = explicit ?? (await flyvaManager.matchTransitionKey(options, el));
		await flyvaManager.run(resolved, options, el);

		if (!config.viewTransition && flyvaManager.runningInstance?.concurrent && flyvaManager.currentContent) {
			injectCloneStyles();

			_capturedClone = flyvaManager.currentContent.cloneNode(true) as HTMLElement;
			_capturedClone.classList.add('flyva-clone');

			const parent = flyvaManager.currentContent.parentNode as HTMLElement | null;
			if (parent) {
				parent.insertBefore(_capturedClone, flyvaManager.currentContent);
			}
		}
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
			await transition.animateViewTransition.call(transition, vt, context);
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
		flyvaManager.finishTransition();
	}

	async function leave() {
		initializedManually = true;

		if (flyvaManager.runningInstance?.cssMode && !config.viewTransition) {
			await leaveWithCssMode();
			return;
		}

		if (_capturedClone) {
			flyvaManager.setContentElements(_capturedClone);
		}

		await flyvaManager.beforeLeave();
		await flyvaManager.readyPromise;
		await flyvaManager.leave();
		await flyvaManager.afterLeave();
	}

	async function beginConcurrentLeaveForNavigation(): Promise<boolean> {
		initializedManually = true;

		if (flyvaManager.runningInstance?.cssMode && !config.viewTransition) {
			await leaveWithCssMode();
			return false;
		}

		if (!_capturedClone || config.viewTransition) {
			await leave();
			return false;
		}

		flyvaManager.setContentElements(_capturedClone);
		await flyvaManager.beforeLeave();
		await flyvaManager.readyPromise;
		return true;
	}

	async function completeConcurrentLeaveAfterNavigation(): Promise<void> {
		await flyvaManager.leave();
		await flyvaManager.afterLeave();
	}

	async function enter() {
		if (!initializedManually) {
			return;
		}

		if (flyvaManager.runningInstance?.cssMode && !config.viewTransition) {
			await enterWithCssMode();
			initializedManually = false;
			return;
		}

		await flyvaManager.beforeEnter();
		await flyvaManager.readyPromise;
		await flyvaManager.enter();
		await flyvaManager.afterEnter();
		initializedManually = false;
	}

	return {
		prepare,
		leave,
		beginConcurrentLeaveForNavigation,
		completeConcurrentLeaveAfterNavigation,
		enter,
		leaveWithViewTransition,
		get hasTransitioned() { return hasTransitioned; },
		get isConcurrent() { return flyvaManager.runningInstance?.concurrent === true; },
		get isViewTransition() { return !!config.viewTransition; },
	};
}
