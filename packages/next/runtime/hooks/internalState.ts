'use client';

export const transitionState = {
	initializedManually: false,
	hasTransitioned: false,
	capturedClone: null as HTMLElement | null,
	cloneSource: null as HTMLElement | null,
	/** Incremented by `FlyvaTransitionWrapper` whenever a new page is committed. */
	commitSeq: 0,
	/** When set, the wrapper waits for it before revealing and entering the committed page. */
	enterGate: null as Promise<void> | null,
};

const CLONE_CSS =
	'.flyva-clone,.flyva-clone *{animation-play-state:paused!important;transition:none!important}';
let styleInjected = false;

export function injectCloneStyles() {
	if (styleInjected || typeof document === 'undefined') return;
	const style = document.createElement('style');
	style.textContent = CLONE_CSS;
	document.head.appendChild(style);
	styleInjected = true;
}

export function createClone(source: HTMLElement): HTMLElement {
	const clone = source.cloneNode(true) as HTMLElement;
	clone.classList.add('flyva-clone');
	return clone;
}

/** Inserts a prepared clone in place of `source` and hides the live source underneath it. */
export function insertClone(source: HTMLElement, clone: HTMLElement) {
	injectCloneStyles();
	source.parentNode?.insertBefore(clone, source);

	// Live source stays in the tree until Next swaps it; hide it so it cannot
	// flash under the clone while the next page is loading.
	source.style.display = 'none';

	transitionState.capturedClone = clone;
	transitionState.cloneSource = source;
}

export function takeEnterGate(): Promise<void> | null {
	const gate = transitionState.enterGate;
	transitionState.enterGate = null;
	return gate;
}
