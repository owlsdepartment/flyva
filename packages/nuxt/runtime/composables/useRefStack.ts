import { onUnmounted, type Ref, ref, watchEffect } from 'vue';

export type MaybeElement = HTMLElement | object | string | number | null;

const globalStack = new Map<string, Ref<MaybeElement | null | undefined>>();

export function useRefStack(key: string, refObject: Ref<MaybeElement | null | undefined>) {
	const stableRef = ref<MaybeElement | null | undefined>(refObject?.value);
	globalStack.set(key, stableRef);

	watchEffect(() => {
		if (!refObject?.value) return;
		stableRef.value = refObject?.value;
	});

	onUnmounted(() => {
		if (globalStack.get(key) === stableRef) {
			globalStack.delete(key);
		}
	});
}

export function globalGetRefStackItem<T extends NonNullable<MaybeElement>>(key: string) {
	return globalStack.get(key) as Ref<T | null | undefined> | undefined;
}

export function globalGetRefStack() {
	return Object.fromEntries(globalStack);
}
