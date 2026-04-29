import type { PageTransitionStage } from './page-transition-manager/types';

/** `document.documentElement` attribute set for the active transition key (e.g. `defaultTransition`). */
export const FLYVA_TRANSITION_DATA_ATTR = 'data-flyva-transition' as const;

const ALL_CLASSES = [
	'prepare',
	'cleanup',
	'running',
	'pending',
	'leave',
	'leave-active',
	'leave-to',
	'enter',
	'enter-active',
	'enter-to',
] as const;

function prefixed(prefix: string, cls: string): string {
	return `${prefix}-${cls}`;
}

function removeAll(el: Element, prefix: string) {
	for (const cls of ALL_CLASSES) {
		el.classList.remove(prefixed(prefix, cls));
	}
}

export function applyLifecycleClasses(
	stage: PageTransitionStage,
	prefix: string,
	transitionKey?: string,
): void {
	if (typeof document === 'undefined') return;

	const el = document.documentElement;

	if (stage === 'none') {
		removeAll(el, prefix);
		el.removeAttribute(FLYVA_TRANSITION_DATA_ATTR);
		return;
	}

	if (transitionKey != null && transitionKey !== '') {
		el.setAttribute(FLYVA_TRANSITION_DATA_ATTR, transitionKey);
	} else {
		el.removeAttribute(FLYVA_TRANSITION_DATA_ATTR);
	}

	switch (stage) {
		case 'prepare':
			removeAll(el, prefix);
			el.classList.add(prefixed(prefix, 'prepare'));
			break;
		case 'cleanup':
			removeAll(el, prefix);
			el.classList.add(prefixed(prefix, 'cleanup'));
			break;
		case 'beforeLeave':
			removeAll(el, prefix);
			el.classList.add(
				prefixed(prefix, 'running'),
				prefixed(prefix, 'leave'),
				prefixed(prefix, 'leave-active'),
			);
			break;
		case 'leave':
			el.classList.remove(prefixed(prefix, 'leave'));
			el.classList.add(prefixed(prefix, 'leave-to'));
			break;
		case 'afterLeave':
			el.classList.remove(prefixed(prefix, 'leave-active'), prefixed(prefix, 'leave-to'));
			el.classList.add(prefixed(prefix, 'pending'));
			break;
		case 'beforeEnter':
			el.classList.remove(prefixed(prefix, 'pending'));
			el.classList.add(prefixed(prefix, 'enter'), prefixed(prefix, 'enter-active'));
			break;
		case 'enter':
			el.classList.remove(prefixed(prefix, 'enter'));
			el.classList.add(prefixed(prefix, 'enter-to'));
			break;
		case 'afterEnter':
			el.classList.remove(prefixed(prefix, 'enter-active'), prefixed(prefix, 'enter-to'));
			break;
	}
}
