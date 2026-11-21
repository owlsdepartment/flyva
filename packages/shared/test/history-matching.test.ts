import { describe, expect, it, vi } from 'vitest';

import { PageTransitionManager } from '../page-transition-manager/PageTransitionManager';
import type { FlyvaNavigation, PageTransition } from '../page-transition-manager/types';
import type { Reactive, ReactiveFactory } from '../types';

function refReactiveFactory<V>(initial?: V): Reactive<V> {
	return { value: initial as V };
}

const factory = refReactiveFactory as ReactiveFactory<unknown, Reactive<unknown>>;

const back: FlyvaNavigation = { type: 'traverse', direction: 'back', delta: -1 };

describe('history-aware matching', () => {
	it('skips history: false transitions for history moves only', async () => {
		const transitions = {
			expand: { history: false, condition: () => true } as PageTransition,
			defaultTransition: {} as PageTransition,
		};
		const manager = new PageTransitionManager(transitions, factory);

		await expect(manager.matchTransitionKey({})).resolves.toBe('expand');
		await expect(manager.matchTransitionKey({}, undefined, { navigation: back })).resolves.toBe(
			'defaultTransition',
		);
	});

	it("skips history: 'only' transitions outside history moves", async () => {
		const transitions = {
			back: { history: 'only', condition: () => true } as PageTransition,
			defaultTransition: {} as PageTransition,
		};
		const manager = new PageTransitionManager(transitions, factory);

		await expect(manager.matchTransitionKey({})).resolves.toBe('defaultTransition');
		await expect(manager.matchTransitionKey({}, undefined, { navigation: back })).resolves.toBe(
			'back',
		);
	});

	it('exposes navigation and history trigger to condition', async () => {
		const condition = vi.fn().mockReturnValue(false);
		const manager = new PageTransitionManager(
			{ t: { condition } as PageTransition, defaultTransition: {} as PageTransition },
			factory,
		);

		await manager.matchTransitionKey({ fromHref: '/a', toHref: '/b' }, undefined, {
			navigation: back,
		});

		expect(condition).toHaveBeenCalledWith(
			expect.objectContaining({
				navigation: back,
				trigger: 'history',
				fromHref: '/a',
				toHref: '/b',
			}),
		);
	});

	it('uses fallbackKey before defaultTransitionKey when nothing matches', async () => {
		const manager = new PageTransitionManager(
			{ back: {} as PageTransition, defaultTransition: {} as PageTransition },
			factory,
		);

		await expect(
			manager.matchTransitionKey({}, undefined, { navigation: back, fallbackKey: 'back' }),
		).resolves.toBe('back');
		await expect(manager.matchTransitionKey({})).resolves.toBe('defaultTransition');
	});

	it('ignores an unregistered fallbackKey', async () => {
		const manager = new PageTransitionManager({ defaultTransition: {} as PageTransition }, factory);

		await expect(
			manager.matchTransitionKey({}, undefined, { fallbackKey: 'missing' as 'defaultTransition' }),
		).resolves.toBe('defaultTransition');
	});

	it('carries navigation into lifecycle contexts until finishTransition', async () => {
		const prepare = vi.fn();
		const manager = new PageTransitionManager({ t: { prepare } as PageTransition }, factory);

		await manager.run('t', {}, undefined, back);

		expect(manager.navigation).toEqual(back);
		expect(prepare).toHaveBeenCalledWith(
			expect.objectContaining({ navigation: back, trigger: 'history' }),
		);

		manager.finishTransition();
		expect(manager.navigation).toBeUndefined();
		expect(manager.makeContext().navigation).toBeUndefined();
	});
});
