import { defineNuxtPlugin } from '#app';
// @ts-expect-error: It's a virtual fs file
import { flyvaTransitions } from '#build/flyva-transitions.ts';

import { PageTransitionManager } from '../../shared/page-tansition-manager';
import { refReactiveFactory } from '../utils/refReactiveFactory';

export default defineNuxtPlugin(() => {
	const manager = new PageTransitionManager(flyvaTransitions ?? {}, refReactiveFactory);

	return {
		provide: {
			flyvaManager: manager,
		},
	};
});

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
