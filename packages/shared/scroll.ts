export interface ScrollToTargetOptions {
	/** Desired scroll top, re-evaluated every frame; `null` while it cannot be resolved yet (e.g. a missing anchor). */
	resolve(): number | null;
	get(): number;
	set(top: number): void;
	/** Give up after this many ms, leaving the scroll wherever it got clamped (default 1000). */
	timeout?: number;
	/** Distance in px that counts as reached (default 1). */
	tolerance?: number;
	signal?: AbortSignal;
}

/**
 * Applies a scroll position and keeps re-applying it every frame until it is actually reached —
 * the document may still be too short right after a page swap. The first attempt runs
 * synchronously. Resolves `true` once reached, `false` on timeout or abort.
 */
export function scrollToTarget({
	resolve,
	get,
	set,
	timeout = 1000,
	tolerance = 1,
	signal,
}: ScrollToTargetOptions): Promise<boolean> {
	const start = performance.now();

	const attempt = () => {
		const top = resolve();
		if (top === null) return false;
		const desired = Math.max(0, top);
		if (Math.abs(get() - desired) > tolerance) set(desired);
		return Math.abs(get() - desired) <= tolerance;
	};

	if (signal?.aborted) return Promise.resolve(false);
	if (attempt()) return Promise.resolve(true);

	return new Promise(done => {
		let frame = 0;
		const finish = (reached: boolean) => {
			cancelAnimationFrame(frame);
			signal?.removeEventListener('abort', onAbort);
			done(reached);
		};
		const onAbort = () => finish(false);
		signal?.addEventListener('abort', onAbort);

		const tick = () => {
			if (attempt()) return finish(true);
			if (performance.now() - start >= timeout) return finish(false);
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
	});
}
