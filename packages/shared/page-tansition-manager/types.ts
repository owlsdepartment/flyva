export interface PageTransitionOptions {
	[key: string]: any;
}

export type PageTransitionTrigger = string | 'internal' | Element;

export interface PageTransitionContext<O = PageTransitionOptions> {
	name: string;
	trigger: PageTransitionTrigger;
	options: O;
	el?: Element;
	current?: Element;
	next?: Element;
	viewTransition?: ViewTransition;
}

export interface PageTransition<O = PageTransitionOptions> {
	concurrent?: boolean;
	cssMode?: boolean;

	viewTransitionNames?:
		| Record<string, string>
		| ((context: PageTransitionContext<O>) => Record<string, string>);

	animateViewTransition?(
		viewTransition: ViewTransition,
		context: PageTransitionContext<O>
	): Promise<void>;

	condition?(context: PageTransitionContext<O>): Promise<boolean> | boolean;

	prepare?(context: PageTransitionContext<O>): Promise<void>;

	beforeLeave?(context: PageTransitionContext<O>): void;
	leave?(context: PageTransitionContext<O>): Promise<void>;
	afterLeave?(context: PageTransitionContext<O>): void;

	beforeEnter?(context: PageTransitionContext<O>): void;
	enter?(context: PageTransitionContext<O>): Promise<void>;
	afterEnter?(context: PageTransitionContext<O>): void;

	cooldown?(context: PageTransitionContext<O>): Promise<void>;

	cleanup?(): void;
}

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
