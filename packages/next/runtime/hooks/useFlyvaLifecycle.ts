'use client';

import type {
	ActiveHookRegistration,
	PageTransitionContext,
	PageTransitionHookResult,
} from '@flyva/shared';
import { useEffect, useRef } from 'react';

import { useFlyvaManager } from './useFlyvaManager';

export interface FlyvaLifecycleCallbacks {
	prepare?(context: PageTransitionContext): PageTransitionHookResult;
	beforeLeave?(context: PageTransitionContext): void;
	leave?(context: PageTransitionContext): PageTransitionHookResult;
	afterLeave?(context: PageTransitionContext): void;
	beforeEnter?(context: PageTransitionContext): void;
	enter?(context: PageTransitionContext): PageTransitionHookResult;
	afterEnter?(context: PageTransitionContext): void;
	cleanup?(): void;
}

export interface UseFlyvaLifecycleOptions {
	/**
	 * When `false` (default), callbacks still run for every manager stage but `prepare` / `leave` / `enter`
	 * do not delay the transition (async work is scheduled, not awaited).
	 * When `true`, those steps await your callback (including async work) and in-flight work can be cancelled on unmount.
	 */
	blocking?: boolean;
}

function createCancellablePromise(promise: Promise<void>): {
	promise: Promise<void>;
	cancel: () => void;
} {
	let cancel: () => void;
	const wrapped = new Promise<void>(resolve => {
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

	const blocking = options?.blocking ?? false;
	const cancellablesRef = useRef<Array<{ cancel: () => void }>>([]);

	useEffect(() => {
		manager.flushDeferredActiveHookCleanupsIfIdle();

		function wrapAsync(key: 'prepare' | 'leave' | 'enter') {
			return (ctx: PageTransitionContext): Promise<void> => {
				const cb = callbacksRef.current[key];
				if (!cb) return Promise.resolve();
				if (!blocking) {
					void Promise.resolve()
						.then(() => cb(ctx))
						.catch(() => {});
					return Promise.resolve();
				}
				const settled = Promise.resolve(cb(ctx)).then(() => {});
				const c = createCancellablePromise(settled);
				cancellablesRef.current.push(c);
				return c.promise.then(() => {
					const idx = cancellablesRef.current.indexOf(c);
					if (idx >= 0) cancellablesRef.current.splice(idx, 1);
				});
			};
		}

		const registration: ActiveHookRegistration = {
			prepare: wrapAsync('prepare'),
			beforeLeave: ctx => {
				callbacksRef.current.beforeLeave?.(ctx);
			},
			leave: wrapAsync('leave'),
			afterLeave: ctx => {
				callbacksRef.current.afterLeave?.(ctx);
			},
			beforeEnter: ctx => {
				callbacksRef.current.beforeEnter?.(ctx);
			},
			enter: wrapAsync('enter'),
			afterEnter: ctx => {
				callbacksRef.current.afterEnter?.(ctx);
			},
			cleanup: () => {
				callbacksRef.current.cleanup?.();
			},
		};

		const unregister = manager.registerActiveHook(registration);

		return () => {
			unregister(() => {
				for (const c of cancellablesRef.current) {
					c.cancel();
				}
				cancellablesRef.current = [];
			});
		};
	}, [blocking, manager]);
}
