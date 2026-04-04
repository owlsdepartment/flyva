'use client';

import { RefObject, useEffect } from 'react';

export type MaybeElement = HTMLElement | object | string | number | null;

const globalStack = new Map<string, RefObject<MaybeElement> | null | undefined>();

function globalGet<T extends NonNullable<MaybeElement>>(key: string) {
	return globalStack.get(key) as RefObject<T | null | undefined> | null | undefined;
}

function getStack() {
	return Object.fromEntries(globalStack);
}

export function useRefStack(key: string, refObject: RefObject<MaybeElement> | null | undefined) {
	function remove() {
		const global = globalStack.get(key);

		if (!global || refObject !== global) {
			return;
		}

		globalStack.delete(key);
	}

	useEffect(() => {
		globalStack.set(key, refObject);

		return () => remove();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return () => remove();
}

export const globalGetRefStackItem = globalGet;

export const globalGetRefStack = getStack;
