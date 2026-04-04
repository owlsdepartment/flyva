'use client';

import type { RefObject, ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

export type RefMap<T extends Record<string, unknown>> = {
	[K in keyof T]: RefObject<T[K]>;
};

export type DetachedRoot<T extends Record<string, unknown>> = {
	refs: RefMap<T>;
	waitForRender: () => Promise<void>;
	destroy: () => void;
};

export function useDetachedRoot<T extends Record<string, unknown>>(
	jsxFactory: (refs: RefMap<T>) => ReactNode
): DetachedRoot<T> {
	const container = document.createElement('div');
	document.body.appendChild(container);

	const root: Root = createRoot(container);

	const refs = new Proxy({} as Record<string | symbol, { current: unknown }>, {
		get(target, prop: string | symbol) {
			if (!(prop in target)) {
				target[prop] = { current: null };
			}
			return target[prop];
		},
	}) as RefMap<T>;

	root.render(jsxFactory(refs));

	return {
		refs,

		async waitForRender() {
			await new Promise<void>(resolve => {
				requestAnimationFrame(() => resolve());
			});
		},

		destroy() {
			root.unmount();
			container.remove();
		},
	};
}
