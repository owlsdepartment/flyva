'use client';

import type { FlyvaNavigation } from '@flyva/shared';

const INDEX_KEY = '__flyvaIndex';
const FLYVA_KEY_PREFIX = '__flyva';

type HistoryState = Record<string, unknown>;

export interface Traversal {
	navigation: FlyvaNavigation;
	fromHref: string;
	toHref: string;
	fromIndex: number;
	toIndex: number;
	/** Only hash / search changed — no route swap, no transition. */
	sameDocument: boolean;
}

type TraverseListener = (traversal: Traversal, event: PopStateEvent) => void;

let installed = false;
let currentIndex = 0;
let currentPath = '';
let replaying = false;
let lastTraversal: Traversal | null = null;
let lastState: unknown = null;
let nativeReplace: History['replaceState'] | null = null;
const beforePushListeners = new Set<() => void>();
const traverseListeners = new Set<TraverseListener>();

function isRecord(value: unknown): value is HistoryState {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readIndex(state: unknown): number | null {
	const index = isRecord(state) ? state[INDEX_KEY] : undefined;
	return typeof index === 'number' ? index : null;
}

function flyvaKeys(state: unknown): HistoryState {
	if (!isRecord(state)) return {};
	return Object.fromEntries(
		Object.entries(state).filter(([key]) => key.startsWith(FLYVA_KEY_PREFIX)),
	);
}

function stamp(data: unknown, carry: HistoryState = {}): unknown {
	if (data !== null && data !== undefined && !isRecord(data)) return data;
	return { ...carry, ...(data ?? {}), [INDEX_KEY]: currentIndex };
}

function normalizePath(path: string) {
	return path.replace(/\/+$/, '') || '/';
}

function consumeTraversal(state: unknown): Traversal {
	const fromIndex = currentIndex;
	const index = readIndex(state);
	const delta = index === null ? 0 : index - currentIndex;
	if (index !== null) currentIndex = index;

	const fromHref = currentPath;
	const toHref = window.location.pathname;
	currentPath = toHref;

	return {
		navigation: {
			type: 'traverse',
			direction: delta < 0 ? 'back' : delta > 0 ? 'forward' : 'none',
			delta,
		},
		fromHref,
		toHref,
		fromIndex,
		toIndex: currentIndex,
		sameDocument: normalizePath(fromHref) === normalizePath(toHref),
	};
}

function withoutFlyvaKeys(state: unknown): HistoryState {
	if (!isRecord(state)) return {};
	return Object.fromEntries(
		Object.entries(state).filter(([key]) => !key.startsWith(FLYVA_KEY_PREFIX)),
	);
}

/**
 * A native fragment navigation (plain `<a href="#…">`) pushes an entry with `null` state and fires
 * `popstate`. Stamp it as a new entry, carrying the previous entry's router state over the way
 * Next does for external `pushState`, because Next reloads on traversal to a state without its
 * own markers.
 */
function adoptFragmentEntry(event: PopStateEvent): boolean {
	if (event.state !== null || readIndex(window.history.state) !== null) return false;
	if (normalizePath(window.location.pathname) !== normalizePath(currentPath)) return false;
	if (!isRecord(lastState) || !nativeReplace) return false;

	currentIndex += 1;
	nativeReplace({ ...withoutFlyvaKeys(lastState), [INDEX_KEY]: currentIndex }, '');
	lastState = window.history.state;
	return true;
}

function onPopState(event: PopStateEvent) {
	if (replaying) return;
	if (adoptFragmentEntry(event)) return;
	const traversal = consumeTraversal(event.state);
	lastState = window.history.state;
	lastTraversal = traversal;
	for (const listener of traverseListeners) listener(traversal, event);
}

/**
 * Wraps `history.pushState` / `replaceState` once to stamp every entry with an index, so a later
 * `popstate` can tell back from forward, and owns the single capture-phase `popstate` listener
 * that feeds history and scroll handling. Next's own state is preserved; Flyva's `__flyva*` keys
 * survive Next replacing the entry's state.
 */
export function installHistoryTracking() {
	if (installed || typeof window === 'undefined') return;
	installed = true;

	const nativePush = window.history.pushState.bind(window.history);
	const replace = window.history.replaceState.bind(window.history);
	nativeReplace = replace;

	currentIndex = readIndex(window.history.state) ?? 0;
	replace(stamp(window.history.state), '');
	currentPath = window.location.pathname;
	lastState = window.history.state;

	window.history.pushState = (data, unused, url) => {
		for (const listener of beforePushListeners) listener();
		currentIndex += 1;
		nativePush(stamp(data), unused, url);
		currentPath = window.location.pathname;
		lastState = window.history.state;
	};
	window.history.replaceState = (data, unused, url) => {
		replace(stamp(data, flyvaKeys(window.history.state)), unused, url);
		currentPath = window.location.pathname;
		lastState = window.history.state;
	};

	window.addEventListener('popstate', onPopState, { capture: true });
}

/** Traversal computed for the `popstate` currently being dispatched (or the last one). */
export function currentTraversal(): Traversal | null {
	return lastTraversal;
}

export function getCurrentIndex() {
	return currentIndex;
}

export function isReplaying() {
	return replaying;
}

/** Dispatches a synthetic `popstate` that tracking (and Flyva's own listeners) ignore. */
export function replayPopState(state: unknown) {
	replaying = true;
	try {
		window.dispatchEvent(new PopStateEvent('popstate', { state }));
	} finally {
		replaying = false;
	}
}

export function onTraverse(listener: TraverseListener): () => void {
	traverseListeners.add(listener);
	return () => {
		traverseListeners.delete(listener);
	};
}

/** Runs right before a new entry is pushed, while the outgoing entry is still current. */
export function onBeforePush(listener: () => void): () => void {
	beforePushListeners.add(listener);
	return () => {
		beforePushListeners.delete(listener);
	};
}

export function readEntryState(key: string): unknown {
	const state = window.history.state;
	return isRecord(state) ? state[key] : undefined;
}

/**
 * Merges `__flyva*` keys into the current entry's state without touching the URL. Entries without
 * state are left alone: Next reloads on traversal to an entry whose state it did not write.
 */
export function writeEntryState(patch: HistoryState) {
	if (!nativeReplace) return;
	const state = window.history.state;
	if (!isRecord(state)) return;
	nativeReplace({ ...state, ...patch }, '');
	lastState = window.history.state;
}
