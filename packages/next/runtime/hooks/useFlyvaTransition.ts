'use client';

import type { PageTransitionOptions } from '@flyva/shared';

import { useFlyvaManager } from './useFlyvaManager';

let initializedManually = false;
let hasTransitioned = false;
let _capturedClone: Element | null = null;

const CLONE_CSS = '.flyva-clone,.flyva-clone *{animation-play-state:paused!important;transition:none!important}';
let _styleInjected = false;

function injectCloneStyles() {
	if (_styleInjected || typeof document === 'undefined') return;
	const style = document.createElement('style');
	style.textContent = CLONE_CSS;
	document.head.appendChild(style);
	_styleInjected = true;
}

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
			injectCloneStyles();

			_capturedClone = flyvaManager.currentContent.cloneNode(true) as Element;
			(_capturedClone as HTMLElement).classList.add('flyva-clone');

			const parent = flyvaManager.currentContent.parentNode as HTMLElement | null;
			if (parent) {
				parent.insertBefore(_capturedClone, flyvaManager.currentContent);
			}
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
