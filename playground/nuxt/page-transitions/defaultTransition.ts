import { animate } from 'animejs';

import { globalGetRefStackItem } from '@flyva/nuxt/runtime/composables/useRefStack';
import type {
	PageTransition,
	PageTransitionContext,
} from '@flyva/shared';

class DefaultTransitionClass implements PageTransition {
	private content: HTMLElement | null = null;

	private shell(): HTMLElement | null {
		return document.querySelector('[data-flyva-content]');
	}

	private fadeTarget(
		context: PageTransitionContext,
		which: 'leave' | 'enter'
	): HTMLElement | null {
		if (which === 'leave') {
			return (context.current as HTMLElement) ?? this.content ?? this.shell();
		}
		return (context.next as HTMLElement) ?? (context.el as HTMLElement) ?? this.content ?? this.shell();
	}

	async prepare() {
		this.content = this.shell();
	}

	beforeLeave(context: PageTransitionContext) {
		const target = this.fadeTarget(context, 'leave');
		if (!target) return;

		document.body.classList.add('flyva-transition-active');
		target.style.pointerEvents = 'none';
	}

	async leave(context: PageTransitionContext) {
		const target = this.fadeTarget(context, 'leave');
		if (!target) return;

		const hero = globalGetRefStackItem<HTMLElement>('hero');

		if (hero?.value) {
			await animate(hero.value, { scale: 0.75, opacity: 0, duration: 320, ease: 'inCubic' });
		}

		await animate(target, { opacity: 0, duration: 420, ease: 'inCubic' });
	}

	afterLeave(context: PageTransitionContext) {
		const target = this.fadeTarget(context, 'leave');
		if (!target) return;
		target.style.pointerEvents = '';
	}

	beforeEnter(context: PageTransitionContext) {
		this.content = this.shell();
		const target = this.fadeTarget(context, 'enter');
		if (!target) return;

		target.style.opacity = '0';
	}

	async enter(context: PageTransitionContext) {
		const target = this.fadeTarget(context, 'enter');
		if (!target) return;

		await animate(target, { opacity: 1, duration: 560, ease: 'outCubic' });
	}

	afterEnter(context: PageTransitionContext) {
		document.body.classList.remove('flyva-transition-active');
	}

	cleanup() {
		this.content = null;
	}
}

export const defaultTransition = new DefaultTransitionClass();
