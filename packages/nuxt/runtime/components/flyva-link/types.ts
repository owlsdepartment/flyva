import type { NuxtLinkProps } from '#app';

import type { PageTransitionContext, PageTransitionOptions } from '../../../common';

export interface FlyvaLinkRawProps {
	flyva?: boolean;
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
}

export interface FlyvaLinkProps extends NuxtLinkProps, FlyvaLinkRawProps {}
