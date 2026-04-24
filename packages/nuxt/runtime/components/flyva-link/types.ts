import type { NuxtLinkProps } from '#app';

import type { PageTransitionContext, PageTransitionOptions } from '../../../common';

/** Transition-specific props when Flyva handles navigation (`flyva` omitted or `true`). */
export type FlyvaLinkAugment = {
	flyvaTransition?: string;
	flyvaOptions?: PageTransitionOptions | (() => PageTransitionOptions);
	onTransitionStart?: () => void;
	onPrepare?(context: PageTransitionContext): void | Promise<void>;
	onBeforeLeave?(context: PageTransitionContext): void;
	onLeave?(context: PageTransitionContext): void | Promise<void>;
	onAfterLeave?(context: PageTransitionContext): void;
	onBeforeEnter?(context: PageTransitionContext): void;
	onEnter?(context: PageTransitionContext): void | Promise<void>;
	onAfterEnter?(context: PageTransitionContext): void;
	onCleanup?(): void;
};

/** Plain `NuxtLink` — transition hooks and Flyva options are not part of the type. */
export type FlyvaLinkBypassProps = NuxtLinkProps & {
	flyva: false;
};

/** Flyva-managed navigation (default when `flyva` is omitted). */
export type FlyvaLinkEnabledProps = NuxtLinkProps & { flyva?: true } & FlyvaLinkAugment;

export type FlyvaLinkProps = FlyvaLinkBypassProps | FlyvaLinkEnabledProps;

/** Augment-only shape (no `flyva` key) — useful for spreads/helpers. */
export type FlyvaLinkRawProps = FlyvaLinkAugment;
