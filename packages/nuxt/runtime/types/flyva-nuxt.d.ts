import type { PageTransition, PageTransitionManager } from '@flyva/shared';

declare module '#build/flyva-transitions.ts' {
	export const flyvaTransitions: Record<string, PageTransition> | undefined;
}

declare module '#app' {
	interface NuxtApp {
		$flyvaManager: PageTransitionManager;
	}
}

declare module 'vue' {
	interface ComponentCustomProperties {
		$flyvaManager: PageTransitionManager;
	}
}
