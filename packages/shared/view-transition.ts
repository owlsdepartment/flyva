import type { PageTransitionContext } from './page-tansition-manager/types';

export function supportsViewTransitions(): boolean {
	return typeof document !== 'undefined' && 'startViewTransition' in document;
}

export function applyViewTransitionNames(
	names: Record<string, string> | ((ctx: PageTransitionContext) => Record<string, string>),
	context: PageTransitionContext
): Record<string, string> {
	const resolved = typeof names === 'function' ? names(context) : names;
	for (const [vtName, selector] of Object.entries(resolved)) {
		const el = document.querySelector(selector);
		if (el instanceof HTMLElement) el.style.viewTransitionName = vtName;
	}
	return resolved;
}

export function clearViewTransitionNames(names: Record<string, string>): void {
	for (const [, selector] of Object.entries(names)) {
		const el = document.querySelector(selector);
		if (el instanceof HTMLElement) el.style.viewTransitionName = '';
	}
}

function parseCssDurations(raw: string): number {
	// "0.6s, 0.3s" → [0.6, 0.3]; "300ms" → [0.3]
	return Math.max(0, ...raw.split(',').map(v => {
		const n = parseFloat(v);
		if (isNaN(n)) return 0;
		return v.trim().endsWith('ms') ? n / 1000 : n;
	}));
}

export function waitForAnimation(el: Element): Promise<void> {
	return new Promise<void>(resolve => {
		const styles = getComputedStyle(el);

		const transDur = parseCssDurations(styles.transitionDuration);
		const transDel = parseCssDurations(styles.transitionDelay);
		const animDur = parseCssDurations(styles.animationDuration);
		const animDel = parseCssDurations(styles.animationDelay);
		const totalMs = Math.max(transDur + transDel, animDur + animDel) * 1000;

		if (totalMs <= 0) {
			resolve();
			return;
		}

		let done = false;
		const finish = () => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			el.removeEventListener('transitionend', onEnd);
			el.removeEventListener('animationend', onEnd);
			resolve();
		};

		const onEnd = (e: Event) => {
			if (e.target === el) finish();
		};

		el.addEventListener('transitionend', onEnd);
		el.addEventListener('animationend', onEnd);

		const timer = setTimeout(finish, totalMs + 16);
	});
}

export function applyCssStageClasses(
	el: Element,
	name: string,
	phase: 'leave' | 'enter'
): Promise<void> {
	const fromClass = `${name}-${phase}-from`;
	const activeClass = `${name}-${phase}-active`;
	const toClass = `${name}-${phase}-to`;

	el.classList.add(fromClass, activeClass);

	void (el as HTMLElement).offsetHeight;

	el.classList.remove(fromClass);
	el.classList.add(toClass);

	return waitForAnimation(el).then(() => {
		el.classList.remove(activeClass, toClass);
	});
}
