import { describe, expect, it, vi } from 'vitest';
import type { Reactive, ReactiveFactory } from '../types';
import {
	PageTransitionManager,
	sortTransitionKeysForMatching,
} from '../page-transition-manager/PageTransitionManager';
import type { PageTransition } from '../page-transition-manager/types';

function refReactiveFactory<V>(initial?: V): Reactive<V> {
	return { value: initial as V };
}

const factory = refReactiveFactory as ReactiveFactory<unknown, Reactive<unknown>>;

describe('PageTransitionManager', () => {
	it('run sets running state and readyPromise from prepare', async () => {
		const prepare = vi.fn().mockResolvedValue(undefined);
		const transitions = { t: { prepare } as PageTransition };
		const manager = new PageTransitionManager(transitions, factory);

		const p = manager.run('t', { foo: 1 });
		expect(manager.isRunning).toBe(true);
		expect(manager.runningName).toBe('t');
		expect(manager.runningInstance).toBe(transitions.t);
		await expect(p).resolves.toBeUndefined();
		expect(prepare).toHaveBeenCalledTimes(1);
		expect(manager.stage).toBe('prepare');
	});

	it('run awaits active prepare hooks together with transition prepare', async () => {
		const transitionPrepare = vi.fn().mockResolvedValue(undefined);
		const hookPrepare = vi.fn().mockResolvedValue(undefined);
		const manager = new PageTransitionManager({ t: { prepare: transitionPrepare } as PageTransition }, factory);
		manager.registerActiveHook({ prepare: hookPrepare });
		await manager.run('t', {});
		expect(transitionPrepare).toHaveBeenCalledTimes(1);
		expect(hookPrepare).toHaveBeenCalledTimes(1);
		expect(manager.stage).toBe('prepare');
	});

	it('run calls previous transition cleanup before replacing', () => {
		const cleanup = vi.fn();
		const a = { cleanup } as PageTransition;
		const b = {} as PageTransition;
		const manager = new PageTransitionManager({ a, b }, factory);

		manager.run('a', {});
		manager.run('b', {});
		expect(cleanup).toHaveBeenCalledTimes(1);
		expect(manager.runningName).toBe('b');
	});

	it('makeContext reflects name, options, trigger, el, current, next, fromHref, and toHref', () => {
		const transitions = { nav: {} as PageTransition };
		const manager = new PageTransitionManager(transitions, factory);
		const btn = document.createElement('button');

		manager.run('nav', { x: true, fromHref: '/from', toHref: '/to' }, btn);
		const cur = document.createElement('div');
		const nxt = document.createElement('div');
		manager.setContentElements(cur, nxt);

		const ctx = manager.makeContext();
		expect(ctx.name).toBe('nav');
		expect(ctx.options).toEqual({ x: true, fromHref: '/from', toHref: '/to' });
		expect(ctx.fromHref).toBe('/from');
		expect(ctx.toHref).toBe('/to');
		expect(ctx.container).toBe(cur);
		expect(ctx.trigger).toBe(btn);
		expect(ctx.current).toBe(cur);
		expect(ctx.next).toBe(nxt);

		const ctxWithEl = manager.makeContext(btn);
		expect(ctxWithEl.el).toBe(btn);
	});

	it('matchTransitionKey returns first transition whose condition is true (object key order)', async () => {
		const transitions = {
			skip: { condition: () => false } as PageTransition,
			pick: { condition: () => true } as PageTransition,
			after: { condition: () => true } as PageTransition,
			defaultTransition: {} as PageTransition,
		};
		const manager = new PageTransitionManager(transitions, factory);
		const key = await manager.matchTransitionKey({ fromHref: '/', toHref: '/x' });
		expect(key).toBe('pick');
	});

	it('sortTransitionKeysForMatching orders by priority desc, then condition without priority, then rest', () => {
		const transitions = {
			a: { priority: 1, condition: () => false } as PageTransition,
			b: { priority: 100, condition: () => false } as PageTransition,
			c: { condition: () => false } as PageTransition,
			d: {} as PageTransition,
			e: { condition: () => false } as PageTransition,
		};
		expect(sortTransitionKeysForMatching(transitions)).toEqual(['b', 'a', 'c', 'e', 'd']);
	});

	it('matchTransitionKey evaluates first truthy condition by priority when multiple match', async () => {
		const transitions = {
			low: { priority: 1, condition: () => true } as PageTransition,
			high: { priority: 100, condition: () => true } as PageTransition,
			defaultTransition: {} as PageTransition,
		};
		const manager = new PageTransitionManager(transitions, factory);
		const key = await manager.matchTransitionKey({});
		expect(key).toBe('high');
	});

	it('matchTransitionKey falls back to defaultTransitionKey when no condition matches', async () => {
		const transitions = {
			skip: { condition: () => false } as PageTransition,
			defaultTransition: {} as PageTransition,
		};
		const manager = new PageTransitionManager(transitions, factory);
		const key = await manager.matchTransitionKey({});
		expect(key).toBe('defaultTransition');
	});

	it('keeps the same options object and fromHref / toHref across the full lifecycle', async () => {
		const options = { fromHref: '/a', toHref: '/b', tag: 'stable' };
		const optionRefs: unknown[] = [];
		const fromHrefs: string[] = [];
		const toHrefs: string[] = [];
		const transition: PageTransition = {
			prepare(ctx) {
				optionRefs.push(ctx.options);
				fromHrefs.push(ctx.fromHref);
				toHrefs.push(ctx.toHref);
			},
			beforeLeave(ctx) {
				optionRefs.push(ctx.options);
				fromHrefs.push(ctx.fromHref);
				toHrefs.push(ctx.toHref);
			},
			leave: async () => {},
			afterLeave: () => {},
			beforeEnter: () => {},
			enter: async () => {},
			afterEnter(ctx) {
				optionRefs.push(ctx.options);
				fromHrefs.push(ctx.fromHref);
				toHrefs.push(ctx.toHref);
			},
		};
		const manager = new PageTransitionManager({ t: transition }, factory);
		await manager.run('t', options);
		await manager.beforeLeave();
		await manager.leave();
		await manager.afterLeave();
		await manager.beforeEnter();
		await manager.enter();
		await manager.afterEnter();
		expect(optionRefs.every(o => o === options)).toBe(true);
		expect(fromHrefs.every(f => f === '/a')).toBe(true);
		expect(toHrefs.every(t => t === '/b')).toBe(true);
	});

	it('runs lifecycle hooks in order and finishTransition clears running state', async () => {
		const order: string[] = [];
		const transition: PageTransition = {
			beforeLeave: () => {
				order.push('beforeLeave');
			},
			leave: async () => {
				order.push('leave');
			},
			afterLeave: () => {
				order.push('afterLeave');
			},
			beforeEnter: () => {
				order.push('beforeEnter');
			},
			enter: async () => {
				order.push('enter');
			},
			afterEnter: () => {
				order.push('afterEnter');
			},
		};
		const manager = new PageTransitionManager({ t: transition }, factory, {
			lifecycleClassPrefix: 'app',
		});

		await manager.run('t', {});
		await manager.beforeLeave();
		expect(document.documentElement.classList.contains('app-leave-active')).toBe(true);

		await manager.leave();
		await manager.afterLeave();
		await manager.beforeEnter();
		await manager.enter();
		await manager.afterEnter();

		expect(order).toEqual([
			'beforeLeave',
			'leave',
			'afterLeave',
			'beforeEnter',
			'enter',
			'afterEnter',
		]);
		expect(manager.runningInstance).toBeUndefined();
		expect(manager.runningName).toBeUndefined();
		expect(manager.isRunning).toBe(false);
		expect(manager.stage).toBe('none');
	});

	it('finishTransition runs active hook cleanup before transition cleanup', async () => {
		const order: string[] = [];
		const transition: PageTransition = {
			beforeLeave: () => {},
			leave: async () => {},
			afterLeave: () => {},
			beforeEnter: () => {},
			enter: async () => {},
			afterEnter: () => {},
			cleanup: () => {
				order.push('transition-cleanup');
			},
		};
		const manager = new PageTransitionManager({ t: transition }, factory);
		const hookCleanup = vi.fn(() => {
			order.push('hook-cleanup');
		});
		manager.registerActiveHook({ cleanup: hookCleanup });
		await manager.run('t', {});
		await manager.beforeLeave();
		await manager.leave();
		await manager.afterLeave();
		await manager.beforeEnter();
		await manager.enter();
		await manager.afterEnter();
		expect(hookCleanup).toHaveBeenCalledTimes(1);
		expect(order).toEqual(['hook-cleanup', 'transition-cleanup']);
	});

	it('registerActiveHook leave runs in parallel with transition leave; unregister stops future calls', async () => {
		const transitionLeave = vi.fn().mockResolvedValue(undefined);
		const hookLeave = vi.fn().mockResolvedValue(undefined);
		const manager = new PageTransitionManager(
			{ t: { leave: transitionLeave } as PageTransition },
			factory,
		);

		await manager.run('t', {});
		const unregister = manager.registerActiveHook({ leave: hookLeave });

		await manager.leave();
		expect(transitionLeave).toHaveBeenCalledTimes(1);
		expect(hookLeave).toHaveBeenCalledTimes(1);

		unregister();
		await manager.afterLeave();
		transitionLeave.mockClear();
		hookLeave.mockClear();

		await manager.leave();
		expect(transitionLeave).toHaveBeenCalledTimes(1);
		expect(hookLeave).not.toHaveBeenCalled();
	});
});
