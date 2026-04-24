import { animate } from 'animejs';

import { defineTransition } from '@flyva/shared';

import { globalGetRefStackItem } from '@flyva/next';

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

		if (hero?.current) {
			animate(hero.current, { scale: 0.95, opacity: 0, duration: 300, ease: 'inQuad' });
		}

		await animate(target, { opacity: 0, duration: 400, ease: 'inQuad' });
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

		await animate(target, { opacity: 1, duration: 400, ease: 'outQuad' });
	},
});
