import { LinkProps } from 'next/link';

import type { PageTransitionOptions } from '../../../common';

export interface FlyvaLinkRawProps {
	flyvaTransition?: string;
	flyvaOptions?: PageTransitionOptions | (() => PageTransitionOptions);
	onTransitionStart?: () => void;
}

export interface FlyvaLinkProps extends LinkProps, FlyvaLinkRawProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | keyof FlyvaLinkRawProps> {
	ref?: React.Ref<HTMLAnchorElement | null>;
}
