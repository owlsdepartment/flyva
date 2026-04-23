'use client';

import { useEffect, useRef } from 'react';

import type { ActiveHookRegistration, PageTransitionContext, PageTransitionStage } from '@flyva/shared';

import { useFlyvaManager } from './useFlyvaManager';

export interface FlyvaLifecycleCallbacks {
	beforeLeave?(context: PageTransitionContext): void | Promise<void>;
	leave?(context: PageTransitionContext): void | Promise<void>;
	afterLeave?(context: PageTransitionContext): void | Promise<void>;
	beforeEnter?(context: PageTransitionContext): void | Promise<void>;
	enter?(context: PageTransitionContext): void | Promise<void>;
	afterEnter?(context: PageTransitionContext): void | Promise<void>;
}

export interface UseFlyvaLifecycleOptions {
	active?: boolean;
}

const STAGE_TO_CALLBACK: Record<string, keyof FlyvaLifecycleCallbacks> = {
	beforeLeave: 'beforeLeave',
	leave: 'leave',
	afterLeave: 'afterLeave',
	beforeEnter: 'beforeEnter',
	enter: 'enter',
	afterEnter: 'afterEnter',
};

function createCancellablePromise(promise: Promise<void>): { promise: Promise<void>; cancel: () => void } {
	let cancel: () => void;
	const wrapped = new Promise<void>((resolve) => {
		cancel = resolve;
		promise.then(resolve, resolve);
	});
	return { promise: wrapped, cancel: cancel! };
}

export function useFlyvaLifecycle(
	callbacks: FlyvaLifecycleCallbacks,
	options?: UseFlyvaLifecycleOptions,
): void {
	const manager = useFlyvaManager();
	const callbacksRef = useRef(callbacks);
	callbacksRef.current = callbacks;

	const active = options?.active ?? false;
	const prevStageRef = useRef<PageTransitionStage>('none');
	const cancellablesRef = useRef<Array<{ cancel: () => void }>>([]);

	useEffect(() => {
		if (!active) return;

		function wrapCallback(key: keyof FlyvaLifecycleCallbacks) {
			return (ctx: PageTransitionContext): Promise<void> => {
				const cb = callbacksRef.current[key];
				if (!cb) return Promise.resolve();
				const settled = Promise.resolve(cb(ctx) as void | Promise<void>).then(() => {});
				const c = createCancellablePromise(settled);
				cancellablesRef.current.push(c);
				return c.promise.then(() => {
					const idx = cancellablesRef.current.indexOf(c);
					if (idx >= 0) cancellablesRef.current.splice(idx, 1);
				});
			};
		}

		const registration: ActiveHookRegistration = {
			beforeLeave: wrapCallback('beforeLeave'),
			leave: wrapCallback('leave'),
			afterLeave: wrapCallback('afterLeave'),
			beforeEnter: wrapCallback('beforeEnter'),
			enter: wrapCallback('enter'),
			afterEnter: wrapCallback('afterEnter'),
		};

		const unregister = manager.registerActiveHook(registration);

		return () => {
			unregister();
			for (const c of cancellablesRef.current) {
				c.cancel();
			}
			cancellablesRef.current = [];
		};
	}, [active, manager]);

	const stage = manager.stage;

	useEffect(() => {
		if (active) return;
		if (stage === prevStageRef.current) return;
		prevStageRef.current = stage;

		const key = STAGE_TO_CALLBACK[stage];
		if (!key) return;

		const ctx = manager.makeContext();
		callbacksRef.current[key]?.(ctx);
	});
}
