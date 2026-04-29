import type {
	ActiveHookRegistration,
	PageTransitionContext,
	PageTransitionHookResult,
	RegisterActiveHookReturn,
} from '@flyva/shared';
import { computed, onMounted, onScopeDispose, shallowRef, watchEffect } from 'vue';

import { useNuxtApp } from '#app';

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
	const { $flyvaManager: manager } = useNuxtApp();
	const blocking = computed(() => options?.blocking ?? false);
	const callbacksRef = shallowRef(callbacks);

	watchEffect(() => {
		callbacksRef.value = callbacks;
	});

	const cancellables: Array<{ cancel: () => void }> = [];

	function wrapAsync(key: 'prepare' | 'leave' | 'enter') {
		return (ctx: PageTransitionContext): Promise<void> => {
			const cb = callbacksRef.value[key];
			if (!cb) return Promise.resolve();
			if (!blocking.value) {
				void Promise.resolve()
					.then(() => cb(ctx))
					.catch(() => {});
				return Promise.resolve();
			}
			const settled = Promise.resolve(cb(ctx)).then(() => {});
			const c = createCancellablePromise(settled);
			cancellables.push(c);
			return c.promise.then(() => {
				const i = cancellables.indexOf(c);
				if (i >= 0) cancellables.splice(i, 1);
			});
		};
	}

	const registration: ActiveHookRegistration = {
		prepare: wrapAsync('prepare'),
		beforeLeave: ctx => {
			callbacksRef.value.beforeLeave?.(ctx);
		},
		leave: wrapAsync('leave'),
		afterLeave: ctx => {
			callbacksRef.value.afterLeave?.(ctx);
		},
		beforeEnter: ctx => {
			callbacksRef.value.beforeEnter?.(ctx);
		},
		enter: wrapAsync('enter'),
		afterEnter: ctx => {
			callbacksRef.value.afterEnter?.(ctx);
		},
		cleanup: () => {
			callbacksRef.value.cleanup?.();
		},
	};

	const unregister = shallowRef<RegisterActiveHookReturn | undefined>(undefined);

	onMounted(() => {
		unregister.value = manager.registerActiveHook(registration);
	});

	onScopeDispose(() => {
		unregister.value?.(() => {
			for (const c of cancellables) {
				c.cancel();
			}
			cancellables.length = 0;
		});
	});
}
