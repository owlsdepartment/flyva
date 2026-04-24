'use client';

import { usePathname } from 'next/navigation';
import { PropsWithChildren, useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { useFlyvaTransition, getCapturedClone, resolveDomSwap, isVtActive } from '../../hooks';
import { useFlyvaConfig } from '../../hooks/useFlyvaConfig';
import { useFlyvaManager } from '../../hooks/useFlyvaManager';

export function FlyvaTransitionWrapper({ children }: PropsWithChildren) {
	const pathname = usePathname();
	const manager = useFlyvaManager();
	const config = useFlyvaConfig();
	const transition = useFlyvaTransition();

	const contentRef = useRef<HTMLDivElement | null>(null);
	const cloneRef = useRef<HTMLDivElement | null>(null);
	const lastCommittedPathnameRef = useRef<string | null>(null);

	const setContentRef = useCallback(
		(el: HTMLDivElement | null) => {
			contentRef.current = el;
			if (el && !manager.isRunning) {
				manager.setContentElements(el);
			}
		},
		[manager],
	);

	useEffect(() => {
		if (!manager.isRunning && contentRef.current) {
			manager.setContentElements(contentRef.current);
		}
	});

	useLayoutEffect(() => {
		if (lastCommittedPathnameRef.current === pathname) {
			return;
		}
		const prevPathname = lastCommittedPathnameRef.current;
		lastCommittedPathnameRef.current = pathname;
		if (prevPathname === null) {
			return;
		}

		if (isVtActive()) {
			if (contentRef.current) {
				manager.setContentElements(undefined, contentRef.current);
			}
			resolveDomSwap();
			return;
		}

		const isCssMode =
			manager.runningInstance?.cssMode === true && !config.viewTransition;

		if (contentRef.current && !isCssMode) {
			contentRef.current.style.cssText = '';
		}

		const runningName = manager.runningName as string | undefined;

		if (isCssMode && runningName && contentRef.current) {
			contentRef.current.classList.add(`${runningName}-enter-from`);
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
		<div ref={setContentRef}>
			{children}
		</div>
	);
}
