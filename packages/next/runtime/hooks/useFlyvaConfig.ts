'use client';

import type { FlyvaNavigation, OutgoingHook, PageTransitionMatchContext } from '@flyva/shared';
import { createContext, useContext } from 'react';

/**
 * How Flyva handles browser back / forward navigation:
 * - `noop`: Flyva does not touch the outgoing page; Next swaps it right away and only the incoming
 *   page's `prepare` / enter hooks run.
 * - `snapshot`: the outgoing page is frozen into a clone inside the `popstate` handler; Next
 *   navigates right away and the leave plays on the snapshot.
 * - `intercept`: Flyva holds the `popstate` event back from Next, runs the leave (on the live page,
 *   or on a clone for concurrent transitions), then releases it. Relies on Next listening to
 *   `popstate` on `window`.
 */
export type FlyvaHistoryStrategy = 'noop' | 'snapshot' | 'intercept';

/** Where the page should land: an absolute top, an anchor, an element, or `null` to leave it as is. */
export type FlyvaScrollTarget = { top: number } | { hash: string } | { element: Element } | null;

/** When the scroll target is applied; `manual` waits for `ctx.scroll.restore()` (or cleanup). */
export type FlyvaScrollRestoreAt = 'beforeEnter' | 'enter' | 'afterEnter' | 'manual';

/** Bridge to the thing that actually scrolls (window by default, or e.g. Lenis). */
export interface FlyvaScrollAdapter {
	get(): number;
	/** Must jump immediately, without smoothing. */
	set(top: number): void;
	/** Called when a transition starts, e.g. `lenis.stop()`. */
	lock?(): void;
	/** Called right before the target is applied, and on cleanup. */
	unlock?(): void;
}

export interface FlyvaScrollContext {
	/** Resolved target for the incoming page. */
	target: FlyvaScrollTarget;
	/** Scroll position the outgoing page was left at. */
	from: number;
	/** Applies the target now; later calls return the same promise. */
	restore(): Promise<void>;
	/** Resolves once the target was reached, or after `restoreTimeout`. */
	restored: Promise<void>;
}

declare module '@flyva/shared' {
	interface FlyvaNavigation {
		/** Strategy Flyva used for this history move (`@flyva/next` only). */
		strategy?: FlyvaHistoryStrategy;
	}

	interface PageTransitionContext {
		/** Present when `config.scroll` is set (`@flyva/next` only). */
		scroll?: FlyvaScrollContext;
	}

	interface PageTransition {
		/**
		 * When `config.scroll` applies the target for this transition (`@flyva/next` only). Defaults to
		 * `config.scroll.restoreAt`, or `afterEnter` for concurrent transitions and `beforeEnter` otherwise.
		 */
		scrollRestoreAt?: FlyvaScrollRestoreAt;
		/** Overrides the computed scroll target, e.g. keep the position on filter-only navigations. */
		scrollTarget?(
			context: PageTransitionMatchContext,
			fallback: FlyvaScrollTarget,
		): FlyvaScrollTarget;
	}
}

export interface FlyvaScrollConfig {
	/** Defaults to the window. A function is resolved lazily, for scrollers created after mount. */
	adapter?: FlyvaScrollAdapter | (() => FlyvaScrollAdapter | null | undefined);
	/** Default restore point; per transition via `scrollRestoreAt`. */
	restoreAt?: FlyvaScrollRestoreAt;
	/** Max ms to keep re-applying a target the page is not tall enough for yet (default 1000). */
	restoreTimeout?: number;
}

export interface FlyvaHistoryMatchContext {
	navigation: FlyvaNavigation;
	fromHref: string;
	toHref: string;
}

export interface FlyvaHistoryConfig<K extends string = string> {
	/**
	 * Strategy for history moves (default `noop`). The function form runs synchronously inside the
	 * `popstate` handler; return `false` to let the move through without a transition.
	 */
	strategy?: FlyvaHistoryStrategy | ((navigation: FlyvaNavigation) => FlyvaHistoryStrategy | false);
	/** Fallback transition for history moves when no `condition` matches (before `defaultKey`). */
	defaultKey?: K;
	/** Pick a transition directly; return `undefined` to fall back to regular matching. */
	transition?(context: FlyvaHistoryMatchContext): K | undefined;
	/** `intercept` only: max wait (ms) for Next to commit after the event is released (default 8000). */
	interceptTimeout?: number;
}

export interface FlyvaConfig<K extends string = string> {
	defaultKey: string;
	viewTransition?: boolean;
	lifecycleClassPrefix?: string;
	/** Global outgoing hooks, run for every concurrent transition (see `PageTransition.prepareOutgoing`). */
	prepareOutgoing?: OutgoingHook | OutgoingHook[];
	/** Opt-in handling of browser back / forward navigation. Omit to leave history moves alone. */
	history?: FlyvaHistoryConfig<K>;
	/**
	 * Opt-in scroll handling: Flyva switches the browser to manual restoration, saves positions per
	 * history entry and applies them (or top / the link's hash on push) during the transition.
	 */
	scroll?: FlyvaScrollConfig;
}

export const FlyvaConfigContext = createContext<FlyvaConfig>(null!);

export function useFlyvaConfig(): FlyvaConfig {
	const ctx = useContext(FlyvaConfigContext);

	if (!ctx) {
		throw new Error('useFlyvaConfig should be used only within FlyvaConfigContext');
	}

	return ctx;
}
