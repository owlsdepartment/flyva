import { describe, expect, it, vi } from 'vitest';
import type { Reactive, ReactiveFactory } from '../types';
import { PageTransitionManager } from '../page-tansition-manager/PageTransitionManager';
import type { PageTransition } from '../page-tansition-manager/types';

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

	it('makeContext reflects name, options, trigger, el, current, and next', () => {
		const transitions = { nav: {} as PageTransition };
		const manager = new PageTransitionManager(transitions, factory);
		const btn = document.createElement('button');

		manager.run('nav', { x: true }, btn);
		const cur = document.createElement('div');
		const nxt = document.createElement('div');
		manager.setContentElements(cur, nxt);

		const ctx = manager.makeContext();
		expect(ctx.name).toBe('nav');
		expect(ctx.options).toEqual({ x: true });
		expect(ctx.trigger).toBe(btn);
		expect(ctx.current).toBe(cur);
		expect(ctx.next).toBe(nxt);

		const ctxWithEl = manager.makeContext(btn);
		expect(ctxWithEl.el).toBe(btn);
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
		transitionLeave.mockClear();
		hookLeave.mockClear();

		await manager.leave();
		expect(transitionLeave).toHaveBeenCalledTimes(1);
		expect(hookLeave).not.toHaveBeenCalled();
	});
});
