import { createTimeline } from 'animejs';

import type { PageTransition, PageTransitionContext } from '@flyva/shared';
import {
	useDetachedRoot,
	type DetachedRoot,
	type RefMap,
} from '@flyva/nuxt/runtime/composables/useDetachedRoot';

type OverlayRefs = {
	root: HTMLDivElement | null;
	blobA: HTMLSpanElement | null;
	blobB: HTMLSpanElement | null;
	blobC: HTMLSpanElement | null;
	blobD: HTMLSpanElement | null;
	blobE: HTMLSpanElement | null;
	logoBox: HTMLDivElement | null;
};

const LOGO_MARK = 'flyva';
const LOGO_SUFFIX = ':nuxt';

function appRootEl(): Element | null {
	return document.querySelector('.flyva-root') ?? document.querySelector('[data-flyva-content]');
}

function logoChars(logoBox: HTMLElement | null): HTMLElement[] {
	if (!logoBox) return [];
	return [...logoBox.querySelectorAll<HTMLElement>('.flyva-detached-logo__char')];
}

class OverlayTransitionClass implements PageTransition {
	private overlay: DetachedRoot<OverlayRefs> | undefined;

	async prepare() {
		this.overlay = useDetachedRoot((refs: RefMap<OverlayRefs>) => (
			<div class="flyva-detached-overlay" ref={refs.root}>
				<div class="flyva-detached-overlay__blobs">
					<span class="flyva-detached-blob flyva-detached-blob--a" ref={refs.blobA}>
						<span class="flyva-detached-blob__drift">
							<span class="flyva-detached-blob__glow" />
						</span>
					</span>
					<span class="flyva-detached-blob flyva-detached-blob--b" ref={refs.blobB}>
						<span class="flyva-detached-blob__drift">
							<span class="flyva-detached-blob__glow" />
						</span>
					</span>
					<span class="flyva-detached-blob flyva-detached-blob--c" ref={refs.blobC}>
						<span class="flyva-detached-blob__drift">
							<span class="flyva-detached-blob__glow" />
						</span>
					</span>
					<span class="flyva-detached-blob flyva-detached-blob--d" ref={refs.blobD}>
						<span class="flyva-detached-blob__drift">
							<span class="flyva-detached-blob__glow" />
						</span>
					</span>
					<span class="flyva-detached-blob flyva-detached-blob--e" ref={refs.blobE}>
						<span class="flyva-detached-blob__drift">
							<span class="flyva-detached-blob__glow" />
						</span>
					</span>
				</div>
				<div class="flyva-detached-logo" ref={refs.logoBox}>
					<span class="flyva-detached-logo__stack">
						{LOGO_MARK.split('').map((ch, i) => (
							<span key={`m-${i}-${ch}`} class="flyva-detached-logo__clip">
								<span class="flyva-detached-logo__char flyva-detached-logo__char--mark">{ch}</span>
							</span>
						))}
						{LOGO_SUFFIX.split('').map((ch, i) => (
							<span key={`s-${i}-${ch}`} class="flyva-detached-logo__clip">
								<span class="flyva-detached-logo__char flyva-detached-logo__char--suffix">{ch}</span>
							</span>
						))}
					</span>
				</div>
			</div>
		));

		await this.overlay.waitForRender();

		const root = this.overlay.refs.root.value;
		if (root) {
			root.style.visibility = 'visible';
			root.style.opacity = '0';
		}
		for (const k of ['blobA', 'blobB', 'blobC', 'blobD', 'blobE'] as const) {
			const el = this.overlay.refs[k].value;
			if (el) el.style.opacity = '0';
		}
		const logoBox = this.overlay.refs.logoBox.value;
		for (const ch of logoChars(logoBox)) {
			ch.style.transform = 'translateY(1.12em)';
		}
	}

	beforeLeave(_context: PageTransitionContext) {
		document.body.classList.add('flyva-transition-active');
	}

	async leave(_context: PageTransitionContext) {
		if (!this.overlay) return;

		const root = this.overlay.refs.root.value;
		const blobs = [
			this.overlay.refs.blobA.value,
			this.overlay.refs.blobB.value,
			this.overlay.refs.blobC.value,
			this.overlay.refs.blobD.value,
			this.overlay.refs.blobE.value,
		].filter(Boolean) as HTMLElement[];
		const logoBox = this.overlay.refs.logoBox.value;
		const chars = logoChars(logoBox);
		const app = appRootEl();

		const tl = createTimeline();

		if (root) {
			tl.add(root, { opacity: 1, duration: 420, ease: 'outQuad' }, 0);
		}
		blobs.forEach((el, i) => {
			tl.add(el, { opacity: 1, duration: 620, ease: 'outQuad' }, 60 + i * 55);
		});

		const charStart = 340;
		const charStep = 48;
		chars.forEach((el, i) => {
			tl.add(el, { translateY: '0em', duration: 420, ease: 'outCubic' }, charStart + i * charStep);
		});

		if (app) {
			tl.add(app, { opacity: 0, duration: 480, ease: 'outQuad' }, 420);
		}

		await tl;
	}

	afterLeave(_context: PageTransitionContext) {
		//
	}

	beforeEnter(_context: PageTransitionContext) {
		//
	}

	async enter(_context: PageTransitionContext) {
		if (!this.overlay) return;

		const root = this.overlay.refs.root.value;
		const blobs = [
			this.overlay.refs.blobA.value,
			this.overlay.refs.blobB.value,
			this.overlay.refs.blobC.value,
			this.overlay.refs.blobD.value,
			this.overlay.refs.blobE.value,
		].filter(Boolean) as HTMLElement[];
		const logoBox = this.overlay.refs.logoBox.value;
		const chars = logoChars(logoBox);
		const app = appRootEl();

		const tl = createTimeline();

		chars.forEach((el, i) => {
			tl.add(el, { translateY: '1.12em', duration: 620, ease: 'outCubic' }, 28 + i * 42);
		});

		blobs.forEach((el, i) => {
			tl.add(el, { opacity: 0, duration: 1080, ease: 'outQuart' }, 320 + i * 58);
		});
		if (root) {
			tl.add(root, { opacity: 0, duration: 1320, ease: 'outQuart' }, 500);
		}
		if (app) {
			tl.add(app, { opacity: 1, duration: 1240, ease: 'outCubic' }, 560);
		}

		await tl;

		if (app) {
			app.removeAttribute('style');
		}
	}

	afterEnter(_context: PageTransitionContext) {
		document.body.classList.remove('flyva-transition-active');
	}

	cleanup() {
		this.overlay?.destroy();
		this.overlay = undefined;
	}
}

export const overlayTransition = new OverlayTransitionClass();
