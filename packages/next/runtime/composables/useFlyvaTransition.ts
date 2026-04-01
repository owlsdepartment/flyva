'use client';

import type { PageTransitionOptions } from '@flyva/shared/page-tansition-manager';

import { useFlyvaManager } from './useFlyvaManager';

let initializedManually = false;
let hasTransitioned = false;

export function useFlyvaTransition() {
	const flyvaManager = useFlyvaManager();

	function prepare(name: string, options: PageTransitionOptions, el?: Element) {
		initializedManually = true;
		hasTransitioned = true;
		return flyvaManager.run(name, options, el);
	}

	async function leave() {
		initializedManually = true;
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
	};
}
