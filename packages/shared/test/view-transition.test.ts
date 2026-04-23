import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as vt from '../view-transition';
import type { PageTransitionContext } from '../page-tansition-manager/types';

const {
	applyCssStageClasses,
	applyViewTransitionNames,
	clearViewTransitionNames,
	supportsViewTransitions,
	waitForAnimation,
} = vt;

describe('supportsViewTransitions', () => {
	const original = Object.getOwnPropertyDescriptor(document, 'startViewTransition');

	afterEach(() => {
		if (original) {
			Object.defineProperty(document, 'startViewTransition', original);
		} else {
			delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
		}
	});

	it('is false when startViewTransition is absent', () => {
		delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
		expect(supportsViewTransitions()).toBe(false);
	});

	it('is true when startViewTransition exists', () => {
		Object.defineProperty(document, 'startViewTransition', {
			configurable: true,
			value: () => {},
		});
		expect(supportsViewTransitions()).toBe(true);
	});
});

describe('applyViewTransitionNames / clearViewTransitionNames', () => {
	it('sets and clears viewTransitionName on matched elements', () => {
		const a = document.createElement('div');
		a.id = 'a';
		const b = document.createElement('div');
		b.className = 'b';
		document.body.append(a, b);

		const ctx = {} as PageTransitionContext;
		const map = applyViewTransitionNames({ foo: '#a', bar: '.b' }, ctx);
		expect(a.style.viewTransitionName).toBe('foo');
		expect(b.style.viewTransitionName).toBe('bar');

		clearViewTransitionNames(map);
		expect(a.style.viewTransitionName).toBe('');
		expect(b.style.viewTransitionName).toBe('');
	});
});

describe('waitForAnimation', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('resolves when computed durations are zero', async () => {
		const el = document.createElement('div');
		await expect(waitForAnimation(el)).resolves.toBeUndefined();
	});
});

describe('applyCssStageClasses', () => {
	it('adds from+active, removes from and adds to before waiting, then cleans up', async () => {
		const el = document.createElement('div');
		document.body.append(el);
		const deferred = Promise.withResolvers<void>();
		const spy = vi.spyOn(vt, 'waitForAnimation').mockReturnValue(deferred.promise);

		const p = applyCssStageClasses(el, 'vt', 'leave');
		expect(el.classList.contains('vt-leave-from')).toBe(false);
		expect(el.classList.contains('vt-leave-active')).toBe(true);
		expect(el.classList.contains('vt-leave-to')).toBe(true);

		deferred.resolve();
		await p;
		expect(el.classList.contains('vt-leave-active')).toBe(false);
		expect(el.classList.contains('vt-leave-to')).toBe(false);
		spy.mockRestore();
	});

	it('uses enter phase class tokens and clears after wait', async () => {
		const el = document.createElement('div');
		document.body.append(el);
		const deferred = Promise.withResolvers<void>();
		const spy = vi.spyOn(vt, 'waitForAnimation').mockReturnValue(deferred.promise);

		const p = applyCssStageClasses(el, 'page', 'enter');
		expect(el.classList.contains('page-enter-from')).toBe(false);
		expect(el.classList.contains('page-enter-active')).toBe(true);
		expect(el.classList.contains('page-enter-to')).toBe(true);

		deferred.resolve();
		await p;
		expect(el.className).toBe('');
		spy.mockRestore();
	});

});
