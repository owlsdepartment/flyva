'use client';

import { useEffect, useRef, useState } from 'react';

export type RefState<T> = {
	value: T;
};

export function useRefState<T>(initialValue: T): RefState<T> {
	const [_, forceUpdate] = useState(0);
	const ref = useRef<RefState<T>>({ value: initialValue });
	const mounted = useRef(false);

	useEffect(() => {
		mounted.current = true;

		return () => {
			mounted.current = false;
		};
	}, []);

	const proxy = useRef<RefState<T>>(new Proxy(ref.current, {
		get(target, prop) {
			return target[prop as keyof RefState<T>];
		},

		set(target, prop, value) {
			if (prop !== 'value') return false;

			target.value = value;

			if (mounted.current) forceUpdate(x => x + 1);

			return true;
		},
	}));

	return proxy.current;
}
