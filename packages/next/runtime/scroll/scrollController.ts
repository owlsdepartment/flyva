'use client';

import {
	type PageTransitionManager,
	type PageTransitionStage,
	scrollToTarget,
} from '@flyva/shared';

import {
	getCurrentIndex,
	installHistoryTracking,
	onBeforePush,
	onTraverse,
	readEntryState,
	writeEntryState,
} from '../history/historyTracking';
import type {
	FlyvaScrollAdapter,
	FlyvaScrollConfig,
	FlyvaScrollContext,
	FlyvaScrollRestoreAt,
	FlyvaScrollTarget,
} from '../hooks/useFlyvaConfig';

const SCROLL_KEY = '__flyvaScroll';
const SAVE_DEBOUNCE_MS = 100;
const DEFAULT_RESTORE_TIMEOUT_MS = 1000;
const INITIAL_RESTORE_TIMEOUT_MS = 3000;
const USER_INPUT_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

export const windowScrollAdapter: FlyvaScrollAdapter = {
	get: () => window.scrollY,
	set: top => window.scrollTo({ top, left: window.scrollX, behavior: 'instant' }),
};

interface ScrollRuntime {
	manager(): PageTransitionManager;
	config(): FlyvaScrollConfig | undefined;
}

interface ActiveScroll {
	scroll: FlyvaScrollContext;
	restoreAt: FlyvaScrollRestoreAt;
	started: boolean;
}

let runtime: ScrollRuntime | null = null;
let active: ActiveScroll | null = null;
let pending: FlyvaScrollTarget | undefined;
let applying: AbortController | null = null;
const positions = new Map<number, number>();

function adapter(): FlyvaScrollAdapter {
	const configured = runtime?.config()?.adapter;
	return (typeof configured === 'function' ? configured() : configured) ?? windowScrollAdapter;
}

function restoreTimeout() {
	return runtime?.config()?.restoreTimeout ?? DEFAULT_RESTORE_TIMEOUT_MS;
}

function savedTop(index: number): number | null {
	const remembered = positions.get(index);
	if (remembered !== undefined) return remembered;
	if (index !== getCurrentIndex()) return null;
	const stored = readEntryState(SCROLL_KEY);
	return typeof stored === 'number' ? stored : null;
}

function anchorElement(hash: string): Element | null {
	const id = decodeURIComponent(hash.replace(/^#/, ''));
	if (!id) return null;
	return document.getElementById(id) ?? document.getElementsByName(id)[0] ?? null;
}

function elementTop(element: Element, current: number) {
	const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
	return element.getBoundingClientRect().top + current - margin;
}

function resolveTop(
	target: Exclude<FlyvaScrollTarget, null>,
	scroller: FlyvaScrollAdapter,
): number | null {
	if ('top' in target) return target.top;
	if ('element' in target)
		return target.element.isConnected ? elementTop(target.element, scroller.get()) : null;
	const { hash } = target;
	if (hash === '' || hash === '#' || hash.toLowerCase() === '#top') return 0;
	const element = anchorElement(hash);
	return element ? elementTop(element, scroller.get()) : null;
}

function apply(target: FlyvaScrollTarget, timeout = restoreTimeout()): Promise<void> {
	applying?.abort();
	const scroller = adapter();
	scroller.unlock?.();
	if (target === null) return Promise.resolve();

	const controller = new AbortController();
	applying = controller;
	const abort = () => controller.abort();
	for (const type of USER_INPUT_EVENTS)
		window.addEventListener(type, abort, { passive: true, once: true });

	return scrollToTarget({
		resolve: () => resolveTop(target, scroller),
		get: () => scroller.get(),
		set: top => scroller.set(top),
		timeout,
		signal: controller.signal,
	}).then(() => {
		for (const type of USER_INPUT_EVENTS) window.removeEventListener(type, abort);
		if (applying === controller) applying = null;
	});
}

function save() {
	if (pending !== undefined || (active && !active.started)) return;
	const top = adapter().get();
	positions.set(getCurrentIndex(), top);
	writeEntryState({ [SCROLL_KEY]: top });
}

function linkTarget(el: Element | undefined): FlyvaScrollTarget {
	if (el instanceof HTMLAnchorElement && el.hash) return { hash: el.hash };
	return { top: 0 };
}

function begin(manager: PageTransitionManager) {
	const instance = manager.runningInstance;
	const context = manager.makeContext();

	let fallback: FlyvaScrollTarget;
	if (context.trigger === 'history') {
		fallback = pending !== undefined ? pending : { top: savedTop(getCurrentIndex()) ?? 0 };
	} else {
		fallback = linkTarget(
			context.el ?? (context.trigger instanceof Element ? context.trigger : undefined),
		);
	}
	pending = undefined;

	const target = instance?.scrollTarget
		? instance.scrollTarget.call(instance, context, fallback)
		: fallback;
	const restoreAt =
		instance?.scrollRestoreAt ??
		runtime?.config()?.restoreAt ??
		(instance?.concurrent ? 'afterEnter' : 'beforeEnter');

	const scroller = adapter();
	const from = scroller.get();
	scroller.lock?.();

	let restoring: Promise<void> | null = null;
	let markRestored!: () => void;
	const restored = new Promise<void>(resolve => {
		markRestored = resolve;
	});

	const entry: ActiveScroll = {
		restoreAt,
		started: false,
		scroll: {
			target,
			from,
			restored,
			restore() {
				if (!restoring) {
					entry.started = true;
					restoring = apply(target).then(markRestored);
				}
				return restoring;
			},
		},
	};

	active = entry;
	manager.setContextExtension('scroll', entry.scroll);
}

function end() {
	const entry = active;
	active = null;
	if (!entry) return;

	if (entry.started) return;
	if (pending !== undefined) adapter().unlock?.();
	else void entry.scroll.restore();
}

function onStage(stage: PageTransitionStage) {
	if (!runtime) return;
	if (stage === 'prepare') {
		begin(runtime.manager());
		return;
	}
	if (!active) return;
	if (stage === active.restoreAt) void active.scroll.restore();
	if (stage === 'cleanup') end();
}

/** Called by `FlyvaTransitionWrapper` when Next commits a new page. */
export function notifyScrollCommit() {
	if (!runtime || pending === undefined) return;
	if (runtime.manager().isRunning) return;
	const target = pending;
	pending = undefined;
	void apply(target);
}

/**
 * Takes over scroll restoration for `FlyvaRoot` when `config.scroll` is set. Must be installed
 * before history handling so it sees each `popstate` first. Returns an uninstall function.
 */
export function installScrollController(next: ScrollRuntime): () => void {
	installHistoryTracking();
	runtime = next;

	const previousRestoration = window.history.scrollRestoration;
	window.history.scrollRestoration = 'manual';

	const offStage = next.manager().onStage(onStage);

	const offPush = onBeforePush(() => {
		if (active && !active.started) {
			positions.set(getCurrentIndex(), active.scroll.from);
			writeEntryState({ [SCROLL_KEY]: active.scroll.from });
			return;
		}
		save();
	});

	const offTraverse = onTraverse(traversal => {
		positions.set(traversal.fromIndex, adapter().get());

		const saved = savedTop(traversal.toIndex);
		const target: FlyvaScrollTarget =
			saved !== null
				? { top: saved }
				: traversal.sameDocument && window.location.hash
					? { hash: window.location.hash }
					: { top: 0 };

		if (traversal.sameDocument) {
			pending = undefined;
			void apply(target);
		} else {
			pending = target;
		}
	});

	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	const onScroll = () => {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(save, SAVE_DEBOUNCE_MS);
	};
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('pagehide', save);

	const initial = readEntryState(SCROLL_KEY);
	if (typeof initial === 'number' && initial > 0) {
		void apply({ top: initial }, Math.max(restoreTimeout(), INITIAL_RESTORE_TIMEOUT_MS));
	}

	return () => {
		offStage();
		offPush();
		offTraverse();
		clearTimeout(saveTimer);
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('pagehide', save);
		applying?.abort();
		window.history.scrollRestoration = previousRestoration;
		runtime = null;
		active = null;
		pending = undefined;
	};
}
