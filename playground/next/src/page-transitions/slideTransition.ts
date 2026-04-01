import { animate } from 'animejs';

import type { PageTransition, PageTransitionContext } from '@flyva/shared';

class SlideTransitionClass implements PageTransition {
	private content: HTMLElement | null = null;
	private direction: 'left' | 'right' = 'right';

	async prepare(context: PageTransitionContext) {
		this.content = document.querySelector('[data-flyva-content]');
		this.direction = context.options?.direction === 'left' ? 'left' : 'right';
	}

	beforeLeave() {
		if (!this.content) return;

		document.body.classList.add('flyva-transition-active');
		this.content.style.pointerEvents = 'none';
		this.content.style.overflow = 'hidden';
	}

	async leave() {
		if (!this.content) return;

		await animate(this.content, {
			translateX: this.direction === 'right' ? '-100%' : '100%',
			opacity: 0,
			duration: 500,
			ease: 'inCubic',
		});
	}

	afterLeave() {
		if (!this.content) return;
		this.content.style.pointerEvents = '';
		this.content.style.overflow = '';
	}

	beforeEnter() {
		this.content = document.querySelector('[data-flyva-content]');
		if (!this.content) return;

		this.content.style.transform = `translateX(${this.direction === 'right' ? '100%' : '-100%'})`;
		this.content.style.opacity = '0';
	}

	async enter() {
		if (!this.content) return;

		await animate(this.content, {
			translateX: '0%',
			opacity: 1,
			duration: 500,
			ease: 'outCubic',
		});
	}

	afterEnter() {
		document.body.classList.remove('flyva-transition-active');
	}

	cleanup() {
		this.content = null;
	}
}

export const slideTransition = new SlideTransitionClass();
