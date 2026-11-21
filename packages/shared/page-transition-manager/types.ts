export interface PageTransitionOptions {
	[key: string]: any;
}

export type PageTransitionTrigger = string | 'internal' | 'history' | Element;

/**
 * Describes a browser history move (back / forward) that triggered a transition. Only set when an
 * adapter handles history navigation (`@flyva/next` with `history` config); `undefined` for link
 * clicks and programmatic navigation.
 */
export interface FlyvaNavigation {
	type: 'traverse';
	/** `'none'` when the entry index is unknown (e.g. entries created before Flyva loaded). */
	direction: 'back' | 'forward' | 'none';
	/** Entry index difference (negative for back); `0` when unknown. */
	delta: number;
}

/** Return type for hooks the manager may await (`prepare`, `leave`, `enter`, …). */
export type PageTransitionHookResult = void | Promise<void>;

/**
 * Context passed to `PageTransition.condition` before a transition is chosen.
 * `name` is not set yet; use `fromHref`, `toHref`, and `options` (including link-level
 * `flyvaOptions` / `flyva-options`) to decide which registered transition applies.
 */
export interface PageTransitionMatchContext<O = PageTransitionOptions> {
	fromHref: string;
	toHref: string;
	options: O;
	trigger: PageTransitionTrigger;
	el?: Element;
	current?: HTMLElement;
	next?: HTMLElement;
	/** Set when the transition was triggered by a history move handled by the adapter. */
	navigation?: FlyvaNavigation;
}

export interface PageTransitionContext<
	O = PageTransitionOptions,
> extends PageTransitionMatchContext<O> {
	name: string;
	viewTransition?: ViewTransition;
	/**
	 * Convenience root for the active lifecycle phase: outgoing content during leave-related hooks,
	 * incoming content during enter-related hooks (falls back to the other side when one is missing).
	 */
	container?: HTMLElement;
}

/**
 * Context passed to `prepareOutgoing` hooks of **concurrent** transitions, right before the outgoing
 * content takes over the leave phase.
 *
 * - Next: `target` is a detached deep clone of `source`; it is inserted (and `source` hidden) only
 *   after every hook resolved, so reshaping it never produces a visible intermediate frame.
 * - Nuxt: Vue keeps the real outgoing page mounted, so `target === source` and `isClone` is `false`.
 */
export interface OutgoingContext<O = PageTransitionOptions> extends PageTransitionContext<O> {
	/** Live outgoing content. */
	source: HTMLElement;
	/** Element that will play the leave phase (the clone in Next, `source` itself in Nuxt). */
	target: HTMLElement;
	isClone: boolean;
	/** Maps an element inside `source` to its counterpart inside `target` (identity when not cloned). */
	counterpart<T extends Element>(live: T): T | null;
	/** Pairs of matching elements in `source` and their counterparts in `target`. */
	pairs<T extends Element = HTMLElement>(selector: string): Array<[live: T, target: T]>;
}

export type OutgoingHook<O = PageTransitionOptions> = (
	context: OutgoingContext<O>,
) => PageTransitionHookResult;

/**
 * A transition implementation: a plain object (recommended via {@link defineTransition}) **or** a
 * class instance (alternative pattern) whose methods may keep private state on `this`. The manager
 * always invokes hooks with `this` set to that instance / object and passes {@link PageTransitionContext}.
 */
export interface PageTransition<O = PageTransitionOptions> {
	concurrent?: boolean;
	cssMode?: boolean;
	/**
	 * Optional sort order for {@link PageTransitionManager.matchTransitionKey} only. Higher numbers
	 * are evaluated first. Omitted `priority` sorts after all numeric priorities: transitions that
	 * still define `condition` come before those without. Ties preserve the map’s original key order.
	 */
	priority?: number;
	/**
	 * Participation in matching for history-triggered navigations (default `true`).
	 * `false` excludes the transition from history matching; `'only'` excludes it from everything else.
	 * Explicit transition keys (e.g. a link's `flyvaTransition`) bypass this filter.
	 */
	history?: boolean | 'only';

	viewTransitionNames?:
		| Record<string, string>
		| ((context: PageTransitionContext<O>) => Record<string, string>);

	animateViewTransition?(
		viewTransition: ViewTransition,
		context: PageTransitionContext<O>,
	): PageTransitionHookResult;

	condition?(context: PageTransitionMatchContext<O>): Promise<boolean> | boolean;

	prepare?(context: PageTransitionContext<O>): PageTransitionHookResult;

	/**
	 * Concurrent transitions only. Reshape the outgoing content before it plays the leave phase.
	 * Runs after global (`prepareOutgoing` config / `onPrepareOutgoing`) and active-hook outgoing hooks.
	 */
	prepareOutgoing?(context: OutgoingContext<O>): PageTransitionHookResult;
	/** Skip global and active-hook `prepareOutgoing` hooks for this transition. */
	isolateOutgoing?: boolean;

	beforeLeave?(context: PageTransitionContext<O>): void;
	leave?(context: PageTransitionContext<O>): PageTransitionHookResult;
	afterLeave?(context: PageTransitionContext<O>): void;

	beforeEnter?(context: PageTransitionContext<O>): void;
	enter?(context: PageTransitionContext<O>): PageTransitionHookResult;
	afterEnter?(context: PageTransitionContext<O>): void;

	cooldown?(context: PageTransitionContext<O>): PageTransitionHookResult;

	cleanup?(context?: PageTransitionContext<O>): void;
}

/**
 * Input for {@link defineTransition}: optional {@link PageTransition} fields plus **any** extra
 * properties or methods (like class “helper” members). Every **function** on the object is wrapped
 * so the manager invokes it with **`this`** set to the returned transition — use standard
 * `method() {}` syntax for helpers and hooks; arrow functions keep lexical `this` and cannot use
 * the transition instance that way.
 */
export type TransitionOptions<O extends PageTransitionOptions = PageTransitionOptions> = Partial<
	PageTransition<O>
> &
	Record<string, any>;

/**
 * Constructor signature for **class-based** transitions. Prefer {@link defineTransition} for new code.
 */
export interface PageTransitionCtor<T = PageTransition> {
	new (): T;
}

export type PageTransitionStage =
	| 'none'
	| 'prepare'
	| 'cleanup'
	| 'beforeEnter'
	| 'enter'
	| 'afterEnter'
	| 'beforeLeave'
	| 'leave'
	| 'afterLeave';

export interface ActiveHookRegistration {
	prepare?(context: PageTransitionContext): PageTransitionHookResult;
	prepareOutgoing?(context: OutgoingContext): PageTransitionHookResult;
	beforeLeave?(context: PageTransitionContext): void;
	leave?(context: PageTransitionContext): PageTransitionHookResult;
	afterLeave?(context: PageTransitionContext): void;
	beforeEnter?(context: PageTransitionContext): void;
	enter?(context: PageTransitionContext): PageTransitionHookResult;
	afterEnter?(context: PageTransitionContext): void;
	cleanup?(): void;
}

export type RegisterActiveHookReturn = (cleanup?: () => void) => void;
