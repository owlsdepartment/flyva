export function omitKeys<T extends object, const K extends readonly (keyof T & string)[]>(
	obj: T,
	keys: K,
): Omit<T, K[number]> {
	const out = { ...obj } as Record<string, unknown>;
	for (const k of keys) {
		delete out[k];
	}
	return out as Omit<T, K[number]>;
}
