import { createApp, type Ref, ref, type VNode } from 'vue';

export type RefMap<T extends Record<string, unknown>> = {
	[K in keyof T]: Ref<T[K]>;
};

export type DetachedRoot<T extends Record<string, unknown>> = {
	refs: RefMap<T>;
	waitForRender: () => Promise<void>;
	destroy: () => void;
};

type RefBucket<T extends Record<string, unknown>> = Partial<{
	[K in keyof T]: Ref<T[K]>;
}>;

function createRefMap<T extends Record<string, unknown>>(): RefMap<T> {
	const store: RefBucket<T> = {};

	return new Proxy({} as RefMap<T>, {
		get(_target, prop: string | symbol): RefMap<T>[keyof T] {
			if (typeof prop !== 'string') {
				throw new TypeError('DetachedRoot refs use string keys only');
			}
			const key = prop as keyof T;
			const existing = store[key];
			if (existing) return existing;
			const created = ref(null) as Ref<T[typeof key]>;
			store[key] = created;
			return created;
		},
	});
}

export function useDetachedRoot<T extends Record<string, unknown>>(
	render: (refs: RefMap<T>) => VNode,
): DetachedRoot<T> {
	const container = document.createElement('div');
	document.body.appendChild(container);

	const refs = createRefMap<T>();

	const app = createApp({
		setup() {
			return (): VNode => render(refs);
		},
	});

	app.mount(container);

	return {
		refs,

		async waitForRender() {
			await new Promise<void>(resolve => {
				requestAnimationFrame(() => resolve());
			});
		},

		destroy() {
			app.unmount();
			container.remove();
		},
	};
}
