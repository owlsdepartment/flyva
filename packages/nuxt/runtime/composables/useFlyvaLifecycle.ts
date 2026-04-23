import { computed, onMounted, onScopeDispose, ref, shallowRef, watch, watchEffect } from 'vue';
import { useNuxtApp } from '#app';

import type {
	ActiveHookRegistration,
	PageTransitionContext,
	PageTransitionStage,
	RegisterActiveHookReturn,
} from '@flyva/shared';

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
	const active = computed(() => options?.active ?? false);
	const prevStage = shallowRef<PageTransitionStage>('none');

	const cancellables: Array<{ cancel: () => void }> = [];

	function wrapCallback(key: keyof FlyvaLifecycleCallbacks) {
		return (ctx: PageTransitionContext): Promise<void> => {
			if (!active.value) return Promise.resolve();

			const cb = callbacks[key];
			if (!cb) return Promise.resolve();
			const settled = Promise.resolve(cb(ctx) as void | Promise<void>).then(() => {});
			const c = createCancellablePromise(settled);
			cancellables.push(c);
			return c.promise.then(() => {
				const i = cancellables.indexOf(c);
				if (i >= 0) cancellables.splice(i, 1);
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

	const unregister = ref<(RegisterActiveHookReturn | undefined)>(undefined);
	
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

	const stage = computed(() => manager.stage);

	watch(stage, s => {
		if (active) return;
		if (s === prevStage.value) return;
		prevStage.value = s;
		const key = STAGE_TO_CALLBACK[s];
		if (!key) return;
		const ctx = manager.makeContext();
		callbacks[key]?.(ctx);
	});
}
