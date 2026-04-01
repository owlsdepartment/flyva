import { animate } from 'animejs';

import { globalGetRefStackItem } from '@flyva/nuxt/runtime/composables/useRefStack';
import type {
	PageTransition,
	PageTransitionContext,
} from '@flyva/shared';

class DefaultTransitionClass implements PageTransition {
	private content: HTMLElement | null = null;

	async prepare() {
		this.content = document.querySelector('[data-flyva-content]');
	}

	beforeLeave() {
		if (!this.content) return;

		document.body.classList.add('flyva-transition-active');
		this.content.style.pointerEvents = 'none';
	}

	async leave() {
		if (!this.content) return;

		const hero = globalGetRefStackItem<HTMLElement>('hero');

		console.log('[globalGetRefStackItem]', hero, hero?.value);

		if (hero?.value) {
			await animate(hero.value, { scale: 0.75, opacity: 0, duration: 300, ease: 'inQuad' });
		}

		await animate(this.content, { opacity: 0, duration: 400, ease: 'inQuad' });
	}

	afterLeave() {
		if (!this.content) return;
		this.content.style.pointerEvents = '';
	}

	beforeEnter() {
		this.content = document.querySelector('[data-flyva-content]');
		if (!this.content) return;

		this.content.style.opacity = '0';
	}

	async enter() {
		if (!this.content) return;

		await animate(this.content, { opacity: 1, duration: 400, ease: 'outQuad' });
	}

	afterEnter(context: PageTransitionContext) {
		document.body.classList.remove('flyva-transition-active');
		console.log('[flyva] defaultTransition complete →', context.options?.toHref);
	}

	cleanup() {
		this.content = null;
	}
}

export const defaultTransition = new DefaultTransitionClass();
