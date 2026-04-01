import type { NuxtLinkProps } from '#app';

import type { PageTransitionOptions } from '../../../common';

export interface FlyvaLinkProps extends NuxtLinkProps {
	flyvaTransition?: string;
	flyvaOptions?: PageTransitionOptions | (() => PageTransitionOptions);
}
