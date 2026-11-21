import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PageTransitionManager } from '../page-transition-manager/PageTransitionManager';
import type { PageTransition, PageTransitionStage } from '../page-transition-manager/types';
import { scrollToTarget } from '../scroll';
import type { Reactive, ReactiveFactory } from '../types';

function refReactiveFactory<V>(initial?: V): Reactive<V> {
	return { value: initial as V };
}

const factory = refReactiveFactory as ReactiveFactory<unknown, Reactive<unknown>>;

function fakeScroller(max: { value: number }) {
	let top = 0;
	return {
		get: () => top,
		set: vi.fn((next: number) => {
			top = Math.min(next, max.value);
		}),
	};
}

describe('scrollToTarget', () => {
	beforeEach(() => {
		vi.useFakeTimers({
			toFake: ['setTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('resolves synchronously reachable targets on the first attempt', async () => {
		const scroller = fakeScroller({ value: 5000 });

		await expect(scrollToTarget({ resolve: () => 800, ...scroller })).resolves.toBe(true);
		expect(scroller.get()).toBe(800);
		expect(scroller.set).toHaveBeenCalledTimes(1);
	});

	it('keeps re-applying until the document is tall enough', async () => {
		const max = { value: 300 };
		const scroller = fakeScroller(max);

		const result = scrollToTarget({ resolve: () => 800, ...scroller });
		expect(scroller.get()).toBe(300);

		await vi.advanceTimersByTimeAsync(50);
		max.value = 2000;
		await vi.advanceTimersByTimeAsync(50);

		await expect(result).resolves.toBe(true);
		expect(scroller.get()).toBe(800);
	});

	it('waits for a target that cannot be resolved yet', async () => {
		const scroller = fakeScroller({ value: 5000 });
		let ready = false;

		const result = scrollToTarget({ resolve: () => (ready ? 400 : null), ...scroller });
		await vi.advanceTimersByTimeAsync(50);
		expect(scroller.set).not.toHaveBeenCalled();

		ready = true;
		await vi.advanceTimersByTimeAsync(50);
		await expect(result).resolves.toBe(true);
		expect(scroller.get()).toBe(400);
	});

	it('gives up after the timeout, leaving the clamped position', async () => {
		const scroller = fakeScroller({ value: 300 });

		const result = scrollToTarget({ resolve: () => 800, timeout: 200, ...scroller });
		await vi.advanceTimersByTimeAsync(300);

		await expect(result).resolves.toBe(false);
		expect(scroller.get()).toBe(300);
	});

	it('stops when aborted', async () => {
		const scroller = fakeScroller({ value: 300 });
		const controller = new AbortController();

		const result = scrollToTarget({ resolve: () => 800, signal: controller.signal, ...scroller });
		controller.abort();

		await expect(result).resolves.toBe(false);
		const calls = scroller.set.mock.calls.length;
		await vi.advanceTimersByTimeAsync(100);
		expect(scroller.set.mock.calls.length).toBe(calls);
	});

	it('clamps negative targets to 0', async () => {
		const scroller = fakeScroller({ value: 5000 });
		scroller.set(100);

		await expect(scrollToTarget({ resolve: () => -50, ...scroller })).resolves.toBe(true);
		expect(scroller.get()).toBe(0);
	});
});

describe('stage listeners and context extensions', () => {
	it('emits every stage before its hooks run', async () => {
		const order: string[] = [];
		const hook = (name: string) => () => {
			order.push(`hook:${name}`);
		};
		const transition: PageTransition = {
			prepare: hook('prepare'),
			beforeLeave: hook('beforeLeave'),
			leave: hook('leave'),
			afterLeave: hook('afterLeave'),
			beforeEnter: hook('beforeEnter'),
			enter: hook('enter'),
			afterEnter: hook('afterEnter'),
			cleanup: hook('cleanup'),
		};
		const manager = new PageTransitionManager({ t: transition }, factory);
		manager.onStage((stage: PageTransitionStage) => order.push(`stage:${stage}`));

		await manager.run('t', {});
		await manager.beforeLeave();
		await manager.leave();
		await manager.afterLeave();
		await manager.beforeEnter();
		await manager.enter();
		await manager.afterEnter();

		const stages = [
			'prepare',
			'beforeLeave',
			'leave',
			'afterLeave',
			'beforeEnter',
			'enter',
			'afterEnter',
			'cleanup',
		];
		expect(order).toEqual(stages.flatMap(stage => [`stage:${stage}`, `hook:${stage}`]));
	});

	it('unregisters stage listeners', async () => {
		const listener = vi.fn();
		const manager = new PageTransitionManager({ t: {} as PageTransition }, factory);
		const off = manager.onStage(listener);
		off();

		await manager.run('t', {});
		expect(listener).not.toHaveBeenCalled();
	});

	it('exposes extensions set during prepare to the prepare hook and later contexts', async () => {
		const prepare = vi.fn();
		const manager = new PageTransitionManager({ t: { prepare } as PageTransition }, factory);
		const scroll = { target: { top: 0 } };
		manager.onStage(stage => {
			if (stage === 'prepare') manager.setContextExtension('scroll', scroll);
		});

		await manager.run('t', {});

		expect(prepare).toHaveBeenCalledWith(expect.objectContaining({ scroll }));
		expect((manager.makeContext() as unknown as { scroll: unknown }).scroll).toBe(scroll);

		manager.setContextExtension('scroll', undefined);
		expect('scroll' in manager.makeContext()).toBe(false);
	});

	it('does not let extensions override core context fields', async () => {
		const manager = new PageTransitionManager({ t: {} as PageTransition }, factory);
		manager.setContextExtension('name', 'spoofed');

		await manager.run('t', {});
		expect(manager.makeContext().name).toBe('t');
	});
});
