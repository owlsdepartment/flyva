'use client';

import { usePathname } from 'next/navigation';
import { PropsWithChildren, useEffect, useLayoutEffect, useRef } from 'react';

import { useFlyvaTransition, getCapturedClone } from '../../hooks';
import { useFlyvaManager } from '../../hooks/useFlyvaManager';

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

	useLayoutEffect(() => {
		if (isMount.current) {
			isMount.current = false;
			return;
		}

		if (contentRef.current) {
			contentRef.current.style.cssText = '';
		}

		const clone = getCapturedClone() as HTMLDivElement | null;

		if (clone && contentRef.current) {
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

			const parent = contentRef.current?.parentElement;
			if (parent?.dataset.flyvaRelative !== undefined) {
				parent.style.position = '';
				delete parent.dataset.flyvaRelative;
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
