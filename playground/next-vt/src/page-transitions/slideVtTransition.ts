import type { PageTransition, PageTransitionContext } from '@flyva/shared';

class SlideVtTransitionClass implements PageTransition {
	viewTransitionNames = {
		'main': '[data-flyva-content]',
	};

	async animateViewTransition(vt: ViewTransition, context: PageTransitionContext) {
		await vt.ready;

		const back = context.options?.direction === 'back';

		document.documentElement.animate(
			{ transform: ['translateX(0)', `translateX(${back ? '30%' : '-30%'})`], opacity: [1, 0.3] },
			{ duration: 650, easing: 'cubic-bezier(0.4, 0, 1, 1)', pseudoElement: '::view-transition-old(main)', fill: 'forwards' }
		);

		document.documentElement.animate(
			{ transform: [`translateX(${back ? '-100%' : '100%'})`, 'translateX(0)'] },
			{ duration: 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(main)', fill: 'forwards' }
		);

		await vt.finished;
	}
}

export const slideVtTransition = new SlideVtTransitionClass();
