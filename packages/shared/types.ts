export type Reactive<T> = {
	value: T;
};

export type ReactiveFactory<T = unknown, R extends Reactive<T> = Reactive<T>> = <V = T>(
	initialValue?: V
) => R extends Reactive<T> ? Reactive<V> : never;
