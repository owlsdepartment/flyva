export interface PageTransitionOptions {
	[key: string]: any;
}

export type PageTransitionTrigger = string | 'internal' | Element;

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
}

export interface PageTransitionContext<O = PageTransitionOptions> extends PageTransitionMatchContext<O> {
	name: string;
	viewTransition?: ViewTransition;
	/**
	 * Convenience root for the active lifecycle phase: outgoing content during leave-related hooks,
	 * incoming content during enter-related hooks (falls back to the other side when one is missing).
	 */
	container?: HTMLElement;
}

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

	viewTransitionNames?:
		| Record<string, string>
		| ((context: PageTransitionContext<O>) => Record<string, string>);

	animateViewTransition?(
		viewTransition: ViewTransition,
		context: PageTransitionContext<O>
	): Promise<void>;

	condition?(context: PageTransitionMatchContext<O>): Promise<boolean> | boolean;

	prepare?(context: PageTransitionContext<O>): Promise<void>;

	beforeLeave?(context: PageTransitionContext<O>): void;
	leave?(context: PageTransitionContext<O>): Promise<void>;
	afterLeave?(context: PageTransitionContext<O>): void;

	beforeEnter?(context: PageTransitionContext<O>): void;
	enter?(context: PageTransitionContext<O>): Promise<void>;
	afterEnter?(context: PageTransitionContext<O>): void;

	cooldown?(context: PageTransitionContext<O>): Promise<void>;

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
	prepare?(context: PageTransitionContext): Promise<void>;
	beforeLeave?(context: PageTransitionContext): void;
	leave?(context: PageTransitionContext): Promise<void>;
	afterLeave?(context: PageTransitionContext): void;
	beforeEnter?(context: PageTransitionContext): void;
	enter?(context: PageTransitionContext): Promise<void>;
	afterEnter?(context: PageTransitionContext): void;
	cleanup?(): void;
}

export type RegisterActiveHookReturn = (cleanup?: () => void) => void;
