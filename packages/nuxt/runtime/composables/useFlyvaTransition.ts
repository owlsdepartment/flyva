import { useNuxtApp } from 'nuxt/app';
import { computed } from 'vue';

import type { PageTransitionOptions } from '../../../shared/page-tansition-manager';

let hasTransitioned = false;

export function useFlyvaTransition() {
	const { $flyvaManager } = useNuxtApp();

	async function prepare(
		transitionKey: string | undefined | null,
		options: PageTransitionOptions,
		el?: Element,
	) {
		hasTransitioned = true;
		const explicit =
			typeof transitionKey === 'string' && transitionKey.length > 0 ? transitionKey : undefined;
		const resolved = explicit ?? (await $flyvaManager.matchTransitionKey(options, el));
		return $flyvaManager.run(resolved, options, el);
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
