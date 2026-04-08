import type { PageTransition, PageTransitionContext } from '@flyva/shared';

export const sharedElementTransition: PageTransition = {
	cssMode: true,
	viewTransitionNames(context: PageTransitionContext) {
		const names: Record<string, string> = {
			'main': '[data-flyva-content]',
		};

		const slug = context.options?.slug;
		if (slug) {
			names['hero'] = `[data-work-card="${slug}"], [data-work-hero]`;
		}

		return names;
	},
};
