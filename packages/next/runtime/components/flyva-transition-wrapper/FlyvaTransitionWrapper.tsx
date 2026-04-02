'use client';

import { usePathname } from 'next/navigation';
import { PropsWithChildren, useEffect, useRef } from 'react';

import { useFlyvaTransition, getCapturedClone } from '../../composables';
import { useFlyvaManager } from '../../composables/useFlyvaManager';

export function FlyvaTransitionWrapper({ children }: PropsWithChildren) {
	const pathname = usePathname();
	const manager = useFlyvaManager();
	const transition = useFlyvaTransition();

	const contentRef = useRef<HTMLDivElement>(null);
	const cloneRef = useRef<HTMLDivElement | null>(null);
	const isMount = useRef(true);

	useEffect(() => {
		if (!manager.isRunning && contentRef.current) {
			manager.setContentElements(contentRef.current);
		}
	});

	useEffect(() => {
		if (isMount.current) {
			isMount.current = false;
			return;
		}

		if (contentRef.current) {
			contentRef.current.style.cssText = '';
		}

		const clone = getCapturedClone() as HTMLDivElement | null;

		if (clone && contentRef.current) {
			contentRef.current.parentNode?.insertBefore(clone, contentRef.current);
			cloneRef.current = clone;
			manager.setContentElements(clone, contentRef.current);
		} else if (contentRef.current) {
			manager.setContentElements(undefined, contentRef.current);
		}

		setTimeout(async () => {
			await transition.enter();

			if (cloneRef.current) {
				cloneRef.current.remove();
				cloneRef.current = null;
			}

			if (contentRef.current) {
				manager.setContentElements(contentRef.current);
			}
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	return (
		<div ref={contentRef}>
			{children}
		</div>
	);
}
