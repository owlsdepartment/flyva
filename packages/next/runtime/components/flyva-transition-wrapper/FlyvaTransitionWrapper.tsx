'use client';

import { usePathname } from 'next/navigation';
import { PropsWithChildren, useEffect } from 'react';

import { useFlyvaTransition } from '../../composables';

export function FlyvaTransitionWrapper({ children }: PropsWithChildren) {
	const pathname = usePathname();
	const transition = useFlyvaTransition();

	useEffect(() => {
		setTimeout(() => {
			transition.enter();
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	return <>{children}</>;
}
