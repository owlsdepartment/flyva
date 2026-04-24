import type { PageTransition, PageTransitionOptions, TransitionOptions } from './types';

/**
 * Builds a {@link PageTransition} from a plain options object. This is the **recommended** way
 * to author transitions in Flyva: lifecycle hooks receive {@link PageTransitionContext} (including
 * `container`, `current`, `next`, navigation fields), and you may attach **any extra fields or methods**
 * on the same object (same idea as private helpers on a class instance).
 *
 * Every **own enumerable function** on `options` (hooks and helpers) is wrapped so calls use
 * **`this ===` the returned object**. Non-function values are copied onto that object as-is.
 * Arrow functions cannot receive a rebound `this`; use `method() {}` for code that needs `this`.
 *
 * Class-based transitions (`new MyTransition()`) remain supported as an alternative pattern.
 */
export function defineTransition<
	O extends PageTransitionOptions = PageTransitionOptions,
	T extends TransitionOptions<O> = TransitionOptions<O>,
>(options: T): PageTransition<O> & T {
	const impl = {} as PageTransition<O> & T;

	for (const key of Object.keys(options) as (keyof T & string)[]) {
		const val = options[key];
		if (typeof val === 'function') {
			(impl as Record<string, unknown>)[key] = function boundFromDefineTransition(
				this: unknown,
				...args: unknown[]
			) {
				return (val as (...args: unknown[]) => unknown).call(impl, ...args);
			};
		} else if (val !== undefined) {
			(impl as Record<string, unknown>)[key] = val;
		}
	}

	return impl;
}
