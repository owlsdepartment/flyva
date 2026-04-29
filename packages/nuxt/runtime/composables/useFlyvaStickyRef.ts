import type { RegisterActiveHookReturn } from '@flyva/shared';
import { customRef, onMounted, onScopeDispose, type Ref } from 'vue';

import { useNuxtApp } from '#app';

export function useFlyvaStickyRef<T extends HTMLElement = HTMLElement>(): Ref<T | null> {
	const { $flyvaManager: manager } = useNuxtApp();

	return customRef<T | null>((track, trigger) => {
		let held: T | null = null;
		let unregister: RegisterActiveHookReturn | undefined;

		onMounted(() => {
			unregister = manager.registerActiveHook({});
		});

		onScopeDispose(() => {
			unregister?.(() => {
				held = null;
				trigger();
			});
		});

		return {
			get() {
				track();
				return held;
			},
			set(v: T | null) {
				if (v != null) {
					held = v;
				}
				trigger();
			},
		};
	});
}
