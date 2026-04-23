'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { forwardRef, PropsWithChildren, useImperativeHandle, useMemo, useRef } from 'react';

import type { PageTransitionContext } from '@flyva/shared';

import { useFlyvaConfig, useFlyvaTransition } from '../../hooks';
import { useFlyvaLifecycle } from '../../hooks/useFlyvaLifecycle';
import type { FlyvaLinkProps } from './types';

function normalizeUrl(url: string): string {
	try {
		const u = new URL(url, window.location.origin);
		return u.origin + u.pathname.replace(/\/+$/, '');
	} catch {
		return '';
	}
}

function extractPath(input: string): string {
	try {
		const url = new URL(input, window.location.origin);
		return url.pathname;
	} catch {
		return input?.split('?')[0]?.split('#')[0] ?? '';
	}
}

const FlyvaLink = forwardRef<HTMLAnchorElement, PropsWithChildren<FlyvaLinkProps>>((props, ref) => {
	const {
		flyva = true,
		flyvaTransition,
		flyvaOptions,
		onTransitionStart,
		onBeforeLeave,
		onLeave,
		onAfterLeave,
		onBeforeEnter,
		onEnter,
		onAfterEnter,
		children,
		...linkProps
	} = props;

	const rootEl = useRef<HTMLAnchorElement>(null);
	const transition = useFlyvaTransition();
	const router = useRouter();
	const config = useFlyvaConfig();
	const pathname = usePathname();

	const callbacksRef = useRef({ onBeforeLeave, onLeave, onAfterLeave, onBeforeEnter, onEnter, onAfterEnter });
	callbacksRef.current = { onBeforeLeave, onLeave, onAfterLeave, onBeforeEnter, onEnter, onAfterEnter };

	const lifecycleCallbacks = useMemo(() => ({
		beforeLeave: (ctx: PageTransitionContext) => { callbacksRef.current.onBeforeLeave?.(ctx); },
		leave: (ctx: PageTransitionContext) => { callbacksRef.current.onLeave?.(ctx); },
		afterLeave: (ctx: PageTransitionContext) => { callbacksRef.current.onAfterLeave?.(ctx); },
		beforeEnter: (ctx: PageTransitionContext) => { callbacksRef.current.onBeforeEnter?.(ctx); },
		enter: (ctx: PageTransitionContext) => { callbacksRef.current.onEnter?.(ctx); },
		afterEnter: (ctx: PageTransitionContext) => { callbacksRef.current.onAfterEnter?.(ctx); },
	}), []);

	useFlyvaLifecycle(lifecycleCallbacks);

	useImperativeHandle(ref, () => rootEl.current!, []);

	if (!flyva) {
		return (
			<Link ref={rootEl} {...linkProps}>
				{children}
			</Link>
		);
	}

	async function handleClick(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
		const href = rootEl.current?.href ?? props.href?.toString();

		if (!href) return;

		e.preventDefault();

		const currentUrl = window.location.origin + pathname;

		const isCurrent = normalizeUrl(currentUrl) === normalizeUrl(href);
		if (isCurrent) return;

		onTransitionStart?.();

		router.prefetch(href);

		const resolvedOptions = typeof flyvaOptions === 'function' ? flyvaOptions() : flyvaOptions;

		await transition.prepare(flyvaTransition ?? config.defaultKey, {
			fromHref: extractPath(currentUrl),
			toHref: extractPath(href),
			...(resolvedOptions ?? {}),
		}, rootEl.current ?? e.target as HTMLElement);

		if (transition.isViewTransition) {
			await transition.leaveWithViewTransition(() => router.push(href));
		} else if (transition.isConcurrent) {
			await transition.leave();
			router.push(href);
		} else {
			await transition.leave();
			router.push(href);
		}
	}

	return (
		<Link ref={rootEl} {...linkProps} onClick={handleClick}>
			{children}
		</Link>
	);
});

FlyvaLink.displayName = 'FlyvaLink';

export { FlyvaLink };
