import { useNuxtApp } from 'nuxt/app';
import { computed } from 'vue';

import type { PageTransitionOptions } from '../../../shared/page-tansition-manager';

let hasTransitioned = false;

export function useFlyvaTransition() {
	const { $flyvaManager } = useNuxtApp();

	function prepare(name: string, options: PageTransitionOptions, el?: Element) {
		hasTransitioned = true;
		return $flyvaManager.run(name, options, el);
	}

	const isRunning = computed(() => $flyvaManager.isRunning);
	const stage = computed(() => $flyvaManager.stage);

	return {
		prepare,
		isRunning,
		stage,
		get hasTransitioned() { return hasTransitioned; },
	};
}
