import { afterEach, describe, expect, it, vi } from 'vitest';
import * as vt from '../view-transition';
import type { PageTransitionContext } from '../page-transition-manager/types';

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
	it('resolves when computed durations are zero', async () => {
		const el = document.createElement('div');
		await expect(waitForAnimation(el)).resolves.toBeUndefined();
	});

	it('resolves on animationend when only animation duration is non-zero', async () => {
		const style = document.createElement('style');
		style.textContent = `
			@keyframes wf-anim-only { to { opacity: 0.5; } }
			.wf-anim-target { animation: wf-anim-only 600s linear forwards; }
		`;
		document.head.append(style);
		const el = document.createElement('div');
		el.className = 'wf-anim-target';
		document.body.append(el);

		const p = waitForAnimation(el);
		await Promise.resolve();
		el.dispatchEvent(new Event('animationend', { bubbles: false }));
		await expect(p).resolves.toBeUndefined();
		style.remove();
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
		const origRaf = globalThis.requestAnimationFrame;
		globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
			cb(0);
			return 0;
		};

		try {
			const p = applyCssStageClasses(el, 'page', 'enter');
			expect(el.classList.contains('page-enter-from')).toBe(false);
			expect(el.classList.contains('page-enter-active')).toBe(true);
			expect(el.classList.contains('page-enter-to')).toBe(true);

			deferred.resolve();
			await p;
			expect(el.className).toBe('');
		} finally {
			globalThis.requestAnimationFrame = origRaf;
			spy.mockRestore();
		}
	});

});

describe('applyCssStageClasses (no transition / animation-only CSS)', () => {
	let styleEl: HTMLStyleElement | null = null;

	function inject(css: string) {
		styleEl = document.createElement('style');
		styleEl.textContent = css;
		document.head.append(styleEl);
	}

	afterEach(() => {
		styleEl?.remove();
		styleEl = null;
	});

	it('leave finishes and clears classes when active has no transition', async () => {
		inject(`
			.snap-leave-from { opacity: 1; }
			.snap-leave-to { opacity: 0; }
			.snap-leave-active { }
		`);
		const el = document.createElement('div');
		document.body.append(el);
		await applyCssStageClasses(el, 'snap', 'leave');
		expect(el.className).toBe('');
	});

	it('enter finishes and clears classes when active has no transition', async () => {
		inject(`
			.snap-enter-from { opacity: 0; }
			.snap-enter-to { opacity: 1; }
			.snap-enter-active { }
		`);
		const el = document.createElement('div');
		document.body.append(el);
		const origRaf = globalThis.requestAnimationFrame;
		globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
			cb(0);
			return 0;
		};
		try {
			await applyCssStageClasses(el, 'snap', 'enter');
		} finally {
			globalThis.requestAnimationFrame = origRaf;
		}
		expect(el.className).toBe('');
	});

	it('leave clears classes after animationend when motion is animation-only', async () => {
		inject(`
			@keyframes flyva-test-leave-kf { to { transform: scale(0.98); } }
			.kf-leave-from { transform: scale(1); }
			.kf-leave-to { transform: scale(1); }
			.kf-leave-active { animation: flyva-test-leave-kf 600s linear forwards; }
		`);
		const el = document.createElement('div');
		document.body.append(el);
		const p = applyCssStageClasses(el, 'kf', 'leave');
		await Promise.resolve();
		el.dispatchEvent(new Event('animationend', { bubbles: false }));
		await p;
		expect(el.className).toBe('');
	});

	it('enter clears classes after animationend when motion is animation-only', async () => {
		inject(`
			@keyframes flyva-test-enter-kf { to { transform: scale(1); } }
			.kf-enter-from { transform: scale(0.98); }
			.kf-enter-to { transform: scale(1); }
			.kf-enter-active { animation: flyva-test-enter-kf 600s linear forwards; }
		`);
		const el = document.createElement('div');
		document.body.append(el);
		const origRaf = globalThis.requestAnimationFrame;
		globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
			cb(0);
			return 0;
		};
		try {
			const p = applyCssStageClasses(el, 'kf', 'enter');
			await Promise.resolve();
			el.dispatchEvent(new Event('animationend', { bubbles: false }));
			await p;
		} finally {
			globalThis.requestAnimationFrame = origRaf;
		}
		expect(el.className).toBe('');
	});
});
