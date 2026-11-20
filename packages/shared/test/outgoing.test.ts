import { describe, expect, it, vi } from 'vitest';

import { createOutgoingContext, freezeAnimations, freezeMedia } from '../outgoing';
import { PageTransitionManager } from '../page-transition-manager/PageTransitionManager';
import type {
	OutgoingContext,
	PageTransition,
	PageTransitionContext,
} from '../page-transition-manager/types';
import type { Reactive, ReactiveFactory } from '../types';

function refReactiveFactory<V>(initial?: V): Reactive<V> {
	return { value: initial as V };
}

const factory = refReactiveFactory as ReactiveFactory<unknown, Reactive<unknown>>;

const baseContext = {
	name: 't',
	fromHref: '/a',
	toHref: '/b',
	options: {},
	trigger: 'internal',
} as PageTransitionContext;

function makeSource() {
	const source = document.createElement('main');
	source.innerHTML =
		'<section><h1 class="title">A</h1><p class="title">B</p></section><video></video>';
	return source;
}

describe('createOutgoingContext', () => {
	it('maps live elements to clone counterparts', () => {
		const source = makeSource();
		const clone = source.cloneNode(true) as HTMLElement;
		const ctx = createOutgoingContext(baseContext, source, clone);

		const liveTitle = source.querySelector('h1')!;
		expect(ctx.isClone).toBe(true);
		expect(ctx.counterpart(source)).toBe(clone);
		expect(ctx.counterpart(liveTitle)).toBe(clone.querySelector('h1'));
		expect(ctx.current).toBe(clone);
		expect(ctx.container).toBe(clone);
	});

	it('keeps counterparts stable after the clone is reshaped', () => {
		const source = makeSource();
		const clone = source.cloneNode(true) as HTMLElement;
		const ctx = createOutgoingContext(baseContext, source, clone);
		const cloneParagraph = clone.querySelector('p');

		clone.querySelector('h1')!.remove();

		expect(ctx.counterpart(source.querySelector('p')!)).toBe(cloneParagraph);
	});

	it('pairs matching elements with their counterparts', () => {
		const source = makeSource();
		const clone = source.cloneNode(true) as HTMLElement;
		const ctx = createOutgoingContext(baseContext, source, clone);

		const pairs = ctx.pairs('.title');
		expect(pairs).toHaveLength(2);
		for (const [live, copy] of pairs) {
			expect(source.contains(live)).toBe(true);
			expect(clone.contains(copy)).toBe(true);
			expect(copy.tagName).toBe(live.tagName);
		}
	});

	it('uses identity when the target is the source', () => {
		const source = makeSource();
		const ctx = createOutgoingContext(baseContext, source, source);
		const title = source.querySelector('h1')!;

		expect(ctx.isClone).toBe(false);
		expect(ctx.counterpart(title)).toBe(title);
		expect(ctx.counterpart(document.createElement('div'))).toBeNull();
	});
});

describe('outgoing helpers', () => {
	it('freezeMedia and freezeAnimations do nothing when not cloned', async () => {
		const source = makeSource();
		const ctx = createOutgoingContext(baseContext, source, source);
		const before = source.innerHTML;

		await freezeMedia({ inViewport: false })(ctx);
		await freezeAnimations()(ctx);

		expect(source.innerHTML).toBe(before);
	});

	it('freezeMedia skips videos without a current frame', async () => {
		const source = makeSource();
		const clone = source.cloneNode(true) as HTMLElement;
		const ctx = createOutgoingContext(baseContext, source, clone);

		await freezeMedia({ inViewport: false })(ctx);

		expect(clone.querySelector('video')).not.toBeNull();
	});
});

describe('PageTransitionManager.prepareOutgoing', () => {
	it('runs global, active and transition hooks in order on the target', async () => {
		const order: string[] = [];
		const targets: HTMLElement[] = [];
		const record = (label: string) => (ctx: OutgoingContext) => {
			order.push(label);
			targets.push(ctx.target);
		};

		const transition: PageTransition = { concurrent: true, prepareOutgoing: record('transition') };
		const manager = new PageTransitionManager({ t: transition }, factory, {
			prepareOutgoing: record('config'),
		});
		manager.onPrepareOutgoing(record('global'));
		manager.registerActiveHook({ prepareOutgoing: record('active') });

		const source = makeSource();
		const clone = source.cloneNode(true) as HTMLElement;
		await manager.run('t', {});
		await manager.prepareOutgoing(source, clone);

		expect(order).toEqual(['config', 'global', 'active', 'transition']);
		expect(targets.every(target => target === clone)).toBe(true);
	});

	it('awaits hooks sequentially', async () => {
		const order: string[] = [];
		const slow = async () => {
			await new Promise(resolve => setTimeout(resolve, 5));
			order.push('slow');
		};
		const transition: PageTransition = {
			concurrent: true,
			prepareOutgoing: () => {
				order.push('transition');
			},
		};
		const manager = new PageTransitionManager({ t: transition }, factory, {
			prepareOutgoing: slow,
		});

		await manager.run('t', {});
		await manager.prepareOutgoing(makeSource());

		expect(order).toEqual(['slow', 'transition']);
	});

	it('skips global and active hooks for isolated transitions', async () => {
		const global = vi.fn();
		const active = vi.fn();
		const own = vi.fn();
		const transition: PageTransition = {
			concurrent: true,
			isolateOutgoing: true,
			prepareOutgoing: own,
		};
		const manager = new PageTransitionManager({ t: transition }, factory, {
			prepareOutgoing: global,
		});
		manager.registerActiveHook({ prepareOutgoing: active });

		await manager.run('t', {});
		await manager.prepareOutgoing(makeSource());

		expect(global).not.toHaveBeenCalled();
		expect(active).not.toHaveBeenCalled();
		expect(own).toHaveBeenCalledTimes(1);
	});

	it('onPrepareOutgoing returns an unregister function', async () => {
		const hook = vi.fn();
		const manager = new PageTransitionManager(
			{ t: { concurrent: true } as PageTransition },
			factory,
		);
		const unregister = manager.onPrepareOutgoing(hook);
		unregister();

		await manager.run('t', {});
		await manager.prepareOutgoing(makeSource());

		expect(hook).not.toHaveBeenCalled();
	});

	it('does nothing when no transition is running', async () => {
		const hook = vi.fn();
		const manager = new PageTransitionManager({ t: {} as PageTransition }, factory, {
			prepareOutgoing: hook,
		});

		await manager.prepareOutgoing(makeSource());

		expect(hook).not.toHaveBeenCalled();
	});
});
