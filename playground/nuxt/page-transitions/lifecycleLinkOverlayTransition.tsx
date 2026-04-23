import { animate } from 'animejs';

import type { PageTransition } from '@flyva/shared';
import {
	useDetachedRoot,
	type DetachedRoot,
	type RefMap,
} from '@flyva/nuxt/runtime/composables/useDetachedRoot';

type OverlayRefs = {
	root: HTMLDivElement | null;
};

class LifecycleLinkOverlayTransitionClass implements PageTransition {
	private overlay: DetachedRoot<OverlayRefs> | undefined;

	async prepare() {
		this.overlay = useDetachedRoot((refs: RefMap<OverlayRefs>) => (
			<div class="flyva-lifecycle-link-overlay" ref={refs.root} />
		));

		await this.overlay.waitForRender();

		const root = this.overlay.refs.root.value;
		if (root) {
			root.style.opacity = '0';
		}
	}

	beforeLeave() {
		document.body.classList.add('flyva-transition-active');
	}

	async leave() {
		const root = this.overlay?.refs.root.value;
		if (!root) return;
		await animate(root, { opacity: 1, duration: 320, ease: 'inQuad' });
	}

	async enter() {
		const root = this.overlay?.refs.root.value;
		if (!root) return;
		await animate(root, { opacity: 0, duration: 380, ease: 'outQuad' });
	}

	afterEnter() {
		document.body.classList.remove('flyva-transition-active');
	}

	cleanup() {
		this.overlay?.destroy();
		this.overlay = undefined;
	}
}

export const lifecycleLinkOverlayTransition = new LifecycleLinkOverlayTransitionClass();
