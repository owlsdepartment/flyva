import { animate } from 'animejs';

import { defineTransition } from '@flyva/shared';

export const historyTransition = defineTransition({
	history: 'only',

	prepare(ctx) {
		const { navigation } = ctx;
		if (!navigation) return;
		document.documentElement.dataset.demoNavigation = `${navigation.direction}:${navigation.delta}:${navigation.strategy ?? ''}`;
	},

	prepareOutgoing(ctx) {
		ctx.target.dataset.demoOutgoing = ctx.isClone ? 'clone' : 'live';
	},

	beforeLeave(ctx) {
		const target = ctx.container;
		if (target) target.style.pointerEvents = 'none';
	},

	async leave(ctx) {
		const target = ctx.container;
		if (!target) return;

		const offset = ctx.navigation?.direction === 'forward' ? -40 : 40;
		await animate(target, { opacity: 0, translateX: offset, duration: 380, ease: 'inQuad' });
	},

	beforeEnter(ctx) {
		const target = ctx.container;
		if (!target) return;
		target.style.transform = '';
		target.style.opacity = '0';
	},

	async enter(ctx) {
		const target = ctx.container;
		if (!target) return;

		const fade = animate(target, { opacity: 1, duration: 420, ease: 'outQuad' });
		if (ctx.scroll) {
			await ctx.scroll.restored;
			document.documentElement.dataset.demoScrollRestored = String(Math.round(window.scrollY));
		}
		await fade;
	},

	cleanup(ctx) {
		const target = ctx?.container;
		if (!target) return;
		target.style.pointerEvents = '';
		target.style.transform = '';
	},
});
