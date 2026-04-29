'use client';

import type { PageTransitionContext } from '@flyva/shared';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
	forwardRef,
	type MouseEvent,
	PropsWithChildren,
	useImperativeHandle,
	useMemo,
	useRef,
} from 'react';

import { useFlyvaTransition } from '../../hooks';
import { useFlyvaLifecycle } from '../../hooks/useFlyvaLifecycle';
import { omitKeys } from '../../utils/omitKeys';
import type { FlyvaLinkAugment, FlyvaLinkProps } from './types';

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

const FLYVA_LINK_PROP_KEYS = [
	'flyva',
	'flyvaTransition',
	'flyvaOptions',
	'onTransitionStart',
	'onPrepare',
	'onBeforeLeave',
	'onLeave',
	'onAfterLeave',
	'onBeforeEnter',
	'onEnter',
	'onAfterEnter',
	'onCleanup',
] as const;

const FlyvaLink = forwardRef<HTMLAnchorElement, PropsWithChildren<FlyvaLinkProps>>((props, ref) => {
	const rootEl = useRef<HTMLAnchorElement>(null);
	const transition = useFlyvaTransition();
	const router = useRouter();
	const pathname = usePathname();

	const enabledProps = props.flyva === false ? null : props;

	const callbacksRef = useRef<Partial<FlyvaLinkAugment>>({});
	callbacksRef.current = enabledProps
		? {
				onPrepare: enabledProps.onPrepare,
				onBeforeLeave: enabledProps.onBeforeLeave,
				onLeave: enabledProps.onLeave,
				onAfterLeave: enabledProps.onAfterLeave,
				onBeforeEnter: enabledProps.onBeforeEnter,
				onEnter: enabledProps.onEnter,
				onAfterEnter: enabledProps.onAfterEnter,
				onCleanup: enabledProps.onCleanup,
			}
		: {};

	const lifecycleCallbacks = useMemo(
		() => ({
			prepare: (ctx: PageTransitionContext) => {
				callbacksRef.current.onPrepare?.(ctx);
			},
			beforeLeave: (ctx: PageTransitionContext) => {
				callbacksRef.current.onBeforeLeave?.(ctx);
			},
			leave: (ctx: PageTransitionContext) => {
				callbacksRef.current.onLeave?.(ctx);
			},
			afterLeave: (ctx: PageTransitionContext) => {
				callbacksRef.current.onAfterLeave?.(ctx);
			},
			beforeEnter: (ctx: PageTransitionContext) => {
				callbacksRef.current.onBeforeEnter?.(ctx);
			},
			enter: (ctx: PageTransitionContext) => {
				callbacksRef.current.onEnter?.(ctx);
			},
			afterEnter: (ctx: PageTransitionContext) => {
				callbacksRef.current.onAfterEnter?.(ctx);
			},
			cleanup: () => {
				callbacksRef.current.onCleanup?.();
			},
		}),
		[],
	);

	useFlyvaLifecycle(lifecycleCallbacks);

	useImperativeHandle(ref, () => rootEl.current!, []);

	if (props.flyva === false) {
		const { children, ...rest } = props;
		const linkProps = omitKeys(rest, ['flyva']);
		return (
			<Link ref={rootEl} {...linkProps}>
				{children}
			</Link>
		);
	}

	const { children, ...rest } = props;
	const { flyvaTransition, flyvaOptions, onTransitionStart } = rest;
	const linkProps = omitKeys(rest, FLYVA_LINK_PROP_KEYS);

	async function handleClick(e: MouseEvent<HTMLAnchorElement>) {
		const href = rootEl.current?.href ?? props.href?.toString();

		if (!href) return;

		e.preventDefault();

		const currentUrl = window.location.origin + pathname;

		const isCurrent = normalizeUrl(currentUrl) === normalizeUrl(href);
		if (isCurrent) return;

		onTransitionStart?.();

		router.prefetch(href);

		const resolvedOptions = typeof flyvaOptions === 'function' ? flyvaOptions() : flyvaOptions;

		await transition.prepare(
			flyvaTransition,
			{
				fromHref: extractPath(currentUrl),
				toHref: extractPath(href),
				...(resolvedOptions ?? {}),
			},
			rootEl.current ?? (e.target as HTMLElement),
		);

		if (transition.isViewTransition) {
			await transition.leaveWithViewTransition(() => router.push(href));
		} else if (transition.isConcurrent) {
			const deferredLeave = await transition.beginConcurrentLeaveForNavigation();
			router.push(href);
			if (deferredLeave) {
				await transition.completeConcurrentLeaveAfterNavigation();
			}
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
