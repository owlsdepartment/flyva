import { animate } from 'animejs';

import { defineTransition } from '@flyva/shared';

import { globalGetRefStackItem } from '@flyva/nuxt/runtime/composables/useRefStack';

export const defaultTransition = defineTransition({
	beforeLeave(ctx) {
		const target = ctx.container;
		if (!target) return;

		target.style.pointerEvents = 'none';
	},

	async leave(ctx) {
		const target = ctx.container;
		if (!target) return;

		const hero = globalGetRefStackItem<HTMLElement>('hero');

		if (hero?.value) {
			await animate(hero.value, { scale: 0.75, opacity: 0, duration: 320, ease: 'inCubic' });
		}

		await animate(target, { opacity: 0, duration: 420, ease: 'inCubic' });
	},

	afterLeave(ctx) {
		const target = ctx.container;
		if (!target) return;
		target.style.pointerEvents = '';
	},

	beforeEnter(ctx) {
		const target = ctx.container;
		if (!target) return;

		target.style.opacity = '0';
	},

	async enter(ctx) {
		const target = ctx.container;
		if (!target) return;

		await animate(target, { opacity: 1, duration: 560, ease: 'outCubic' });
	},
});
