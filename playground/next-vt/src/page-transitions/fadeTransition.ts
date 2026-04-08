import type { PageTransition } from '@flyva/shared';

export const fadeTransition: PageTransition = {
	cssMode: true,
	viewTransitionNames: {
		'main': '[data-flyva-content]',
	},
};
