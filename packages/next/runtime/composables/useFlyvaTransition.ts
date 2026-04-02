'use client';

import type { PageTransitionOptions } from '@flyva/shared';

import { useFlyvaManager } from './useFlyvaManager';

let initializedManually = false;
let hasTransitioned = false;
let _capturedClone: Element | null = null;

export function getCapturedClone(): Element | null {
	const clone = _capturedClone;
	_capturedClone = null;
	return clone;
}

export function useFlyvaTransition() {
	const flyvaManager = useFlyvaManager();

	async function prepare(name: string, options: PageTransitionOptions, el?: Element) {
		initializedManually = true;
		hasTransitioned = true;
		await flyvaManager.run(name, options, el);

		if (flyvaManager.runningInstance?.concurrent && flyvaManager.currentContent) {
			_capturedClone = flyvaManager.currentContent.cloneNode(true) as Element;
		}
	}

	async function leave() {
		initializedManually = true;

		if (_capturedClone) {
			flyvaManager.setContentElements(_capturedClone);
		}

		flyvaManager.beforeLeave();
		await flyvaManager.readyPromise;
		await flyvaManager.leave();
		flyvaManager.afterLeave();
	}

	async function enter() {
		if (!initializedManually) {
			return;
		}

		flyvaManager.beforeEnter();
		await flyvaManager.readyPromise;
		await flyvaManager.enter();
		flyvaManager.afterEnter();
		initializedManually = false;
	}

	return {
		prepare,
		leave,
		enter,
		get hasTransitioned() { return hasTransitioned; },
		get isConcurrent() { return flyvaManager.runningInstance?.concurrent === true; },
	};
}
