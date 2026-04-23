import type { NuxtLinkProps } from '#app';

import type { PageTransitionContext, PageTransitionOptions } from '../../../common';

export interface FlyvaLinkRawProps {
	flyva?: boolean;
	flyvaTransition?: string;
	flyvaOptions?: PageTransitionOptions | (() => PageTransitionOptions);
	onTransitionStart?: () => void;
	onBeforeLeave?(context: PageTransitionContext): void;
	onLeave?(context: PageTransitionContext): void;
	onAfterLeave?(context: PageTransitionContext): void;
	onBeforeEnter?(context: PageTransitionContext): void;
	onEnter?(context: PageTransitionContext): void;
	onAfterEnter?(context: PageTransitionContext): void;
}

export interface FlyvaLinkProps extends NuxtLinkProps, FlyvaLinkRawProps {}
