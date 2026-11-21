'use client';

import type { FlyvaNavigation } from '@flyva/shared';

const INDEX_KEY = '__flyvaIndex';

type HistoryState = Record<string, unknown>;

let installed = false;
let currentIndex = 0;
let currentPath = '';

function isRecord(value: unknown): value is HistoryState {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readIndex(state: unknown): number | null {
	const index = isRecord(state) ? state[INDEX_KEY] : undefined;
	return typeof index === 'number' ? index : null;
}

function stamp(data: unknown): unknown {
	if (data !== null && data !== undefined && !isRecord(data)) return data;
	return { ...(data ?? {}), [INDEX_KEY]: currentIndex };
}

function normalizePath(path: string) {
	return path.replace(/\/+$/, '') || '/';
}

/**
 * Wraps `history.pushState` / `replaceState` once to stamp every entry with an index, so a later
 * `popstate` can tell back from forward. Next's own state is preserved; only one key is added.
 */
export function installHistoryTracking() {
	if (installed || typeof window === 'undefined') return;
	installed = true;

	const nativePush = window.history.pushState.bind(window.history);
	const nativeReplace = window.history.replaceState.bind(window.history);

	currentIndex = readIndex(window.history.state) ?? 0;
	nativeReplace(stamp(window.history.state), '');
	currentPath = window.location.pathname;

	window.history.pushState = (data, unused, url) => {
		currentIndex += 1;
		nativePush(stamp(data), unused, url);
		currentPath = window.location.pathname;
	};
	window.history.replaceState = (data, unused, url) => {
		nativeReplace(stamp(data), unused, url);
		currentPath = window.location.pathname;
	};
}

export interface Traversal {
	navigation: FlyvaNavigation;
	fromHref: string;
	toHref: string;
	/** Only hash / search changed — no route swap, no transition. */
	sameDocument: boolean;
}

/** Reads a `popstate` and advances the tracked index / path. Call exactly once per event. */
export function consumeTraversal(state: unknown): Traversal {
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
		sameDocument: normalizePath(fromHref) === normalizePath(toHref),
	};
}
