'use client';

import type { FlyvaNavigation, OutgoingHook } from '@flyva/shared';
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

declare module '@flyva/shared' {
	interface FlyvaNavigation {
		/** Strategy Flyva used for this history move (`@flyva/next` only). */
		strategy?: FlyvaHistoryStrategy;
	}
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
}

export const FlyvaConfigContext = createContext<FlyvaConfig>(null!);

export function useFlyvaConfig(): FlyvaConfig {
	const ctx = useContext(FlyvaConfigContext);

	if (!ctx) {
		throw new Error('useFlyvaConfig should be used only within FlyvaConfigContext');
	}

	return ctx;
}
