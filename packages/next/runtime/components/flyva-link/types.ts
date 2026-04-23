import { LinkProps } from 'next/link';

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

export interface FlyvaLinkProps extends LinkProps, FlyvaLinkRawProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | keyof FlyvaLinkRawProps> {
	ref?: React.Ref<HTMLAnchorElement | null>;
}
