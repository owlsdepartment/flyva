import { animate } from 'animejs';

import type { PageTransition, PageTransitionContext, PageTransitionMatchContext } from '@flyva/shared';

function isWorkIndexPath(toHref: string): boolean {
	try {
		const pathname = new URL(toHref, 'http://local').pathname.replace(/\/+$/, '') || '/';
		return pathname === '/work';
	} catch {
		const p = toHref.split('?')[0]?.split('#')[0]?.replace(/\/+$/, '') || '/';
		return p === '/work';
	}
}

class SlideOverTransitionClass implements PageTransition {
	concurrent = true;
	priority = 100;

	condition(ctx: PageTransitionMatchContext) {
		return isWorkIndexPath(ctx.toHref);
	}

	async prepare() {
		document.body.style.overflow = 'hidden';
	}

	async leave(context: PageTransitionContext) {
		const old = context.current as HTMLElement;
		if (!old) return;

		const scrollTop = document.documentElement.scrollTop;
		Object.assign(old.style, {
			transformOrigin: `50% ${scrollTop}px`,
			transform: 'scale(1)',
		});

		await animate(old, {
			opacity: 0.3,
			transformOrigin: `50% ${scrollTop}px`,
			transform: 'scale(0.9)',
			duration: 400,
			ease: 'inOut',
		});
	}

	beforeEnter(context: PageTransitionContext) {
		const next = context.next as HTMLElement;
		if (!next) return;

		Object.assign(next.style, {
			position: 'fixed',
			top: '0',
			left: '0',
			width: '100%',
			height: '100%',
			overflow: 'auto',
			transform: 'translateY(100%)',
		});
	}

	async enter(context: PageTransitionContext) {
		const next = context.next as HTMLElement;
		if (!next) return;

		await animate(next, {
			translateY: '0%',
			duration: 700,
			ease: 'outCubic',
		});

		const old = context.current as HTMLElement;
		if (old) old.style.display = 'none';

		window.scrollTo(0, 0);
		next.style.cssText = '';
	}

	cleanup() {
		document.body.style.overflow = '';
	}
}

export const slideTransition = new SlideOverTransitionClass();
