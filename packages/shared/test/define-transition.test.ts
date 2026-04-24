import { describe, expect, it } from 'vitest';

import { defineTransition } from '../page-transition-manager/define-transition';
import type { PageTransitionContext, PageTransitionMatchContext } from '../page-transition-manager/types';

function minimalContext(over: Partial<PageTransitionContext> = {}): PageTransitionContext {
	return {
		name: 't',
		fromHref: '/',
		toHref: '/b',
		options: {},
		trigger: 'internal',
		...over,
	} as PageTransitionContext;
}

describe('defineTransition', () => {
	it('copies extra fields and binds this for custom helper methods', async () => {
		const t = defineTransition({
			version: 2,
			shell() {
				return document.querySelector('[data-flyva-content]');
			},
			async leave(ctx: PageTransitionContext) {
				expect(this.version).toBe(2);
				const el = (this as { shell(): Element | null }).shell();
				expect(el).toBe(ctx.current ?? null);
			},
		});

		const cur = document.createElement('div');
		cur.setAttribute('data-flyva-content', '');
		document.body.append(cur);
		try {
			expect(t.version).toBe(2);
			await t.leave?.(minimalContext({ current: cur }));
		} finally {
			cur.remove();
		}
	});

	it('binds this to the returned transition object for lifecycle hooks', async () => {
		const t = defineTransition({
			async prepare() {
				expect(this).toBe(t);
			},
			beforeLeave() {
				expect(this).toBe(t);
			},
			async leave() {
				expect(this).toBe(t);
			},
			cleanup() {
				expect(this).toBe(t);
			},
		});

		const ctx = minimalContext();
		await t.prepare?.(ctx);
		t.beforeLeave?.(ctx);
		await t.leave?.(ctx);
		t.cleanup?.(ctx);
	});

	it('binds this for condition and viewTransitionNames callbacks', async () => {
		const t = defineTransition({
			condition() {
				expect(this).toBe(t);
				return true;
			},
			viewTransitionNames() {
				expect(this).toBe(t);
				return { a: '#x' };
			},
		});

		const matchCtx: PageTransitionMatchContext = {
			fromHref: '/',
			toHref: '/',
			options: {},
			trigger: 'internal',
		};
		expect(t.condition?.call(t, matchCtx)).toBe(true);
		const el = document.createElement('div');
		el.id = 'x';
		document.body.append(el);
		try {
			const m = t.viewTransitionNames;
			expect(typeof m).toBe('function');
			if (typeof m === 'function') {
				expect(m.call(t, minimalContext())).toEqual({ a: '#x' });
			}
		} finally {
			el.remove();
		}
	});
});
