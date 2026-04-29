import type { LinkProps } from 'next/link';
import type { AnchorHTMLAttributes, Ref } from 'react';

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

type FlyvaLinkAnchorRest = Omit<
	AnchorHTMLAttributes<HTMLAnchorElement>,
	keyof LinkProps | keyof FlyvaLinkAugment | 'flyva'
>;

type FlyvaLinkPropsBase = LinkProps &
	FlyvaLinkAnchorRest & {
		ref?: Ref<HTMLAnchorElement | null>;
	};

/** Plain `next/link` — transition hooks and Flyva options are not part of the type. */
export type FlyvaLinkBypassProps = FlyvaLinkPropsBase & {
	flyva: false;
};

/** Flyva-managed navigation (default when `flyva` is omitted). */
export type FlyvaLinkEnabledProps = FlyvaLinkPropsBase & { flyva?: true } & FlyvaLinkAugment;

export type FlyvaLinkProps = FlyvaLinkBypassProps | FlyvaLinkEnabledProps;

/** Augment-only shape (no `flyva` key) — useful for spreads/helpers. */
export type FlyvaLinkRawProps = FlyvaLinkAugment;
