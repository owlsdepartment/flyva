export interface PageTransitionOptions {
	[key: string]: any;
}

export type PageTransitionTrigger = string | 'internal' | Element;

export interface PageTransitionContext<O = PageTransitionOptions> {
	name: string;
	trigger: PageTransitionTrigger;
	options: O;
	el?: Element;
}

export interface PageTransition<O = PageTransitionOptions> {
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
	| 'beforeEnter'
	| 'enter'
	| 'afterEnter'
	| 'beforeLeave'
	| 'leave'
	| 'afterLeave';
