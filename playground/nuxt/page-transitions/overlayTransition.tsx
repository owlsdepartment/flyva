import { createTimeline } from 'animejs';

import type { PageTransition, PageTransitionContext } from '@flyva/shared';
import {
	useDetachedRoot,
	type DetachedRoot,
	type RefMap,
} from '@flyva/nuxt/runtime/composables/useDetachedRoot';

import detached from '~/page-transitions/OverlayDetached.module.scss';

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
	return [...logoBox.querySelectorAll<HTMLElement>('[data-overlay-logo-char]')];
}

class OverlayTransitionClass implements PageTransition {
	private overlay: DetachedRoot<OverlayRefs> | undefined;

	async prepare() {
		this.overlay = useDetachedRoot((refs: RefMap<OverlayRefs>) => (
			<div class={detached.overlay} ref={refs.root}>
				<div class={detached.blobs}>
					<span class={detached.blobA} ref={refs.blobA}>
						<span class={detached.drift}>
							<span class={detached.glow} />
						</span>
					</span>
					<span class={detached.blobB} ref={refs.blobB}>
						<span class={detached.drift}>
							<span class={detached.glow} />
						</span>
					</span>
					<span class={detached.blobC} ref={refs.blobC}>
						<span class={detached.drift}>
							<span class={detached.glow} />
						</span>
					</span>
					<span class={detached.blobD} ref={refs.blobD}>
						<span class={detached.drift}>
							<span class={detached.glow} />
						</span>
					</span>
					<span class={detached.blobE} ref={refs.blobE}>
						<span class={detached.drift}>
							<span class={detached.glow} />
						</span>
					</span>
				</div>
				<div class={detached.logo} ref={refs.logoBox}>
					<span class={detached.logoStack}>
						{LOGO_MARK.split('').map((ch, i) => (
							<span key={`m-${i}-${ch}`} class={detached.logoClip}>
								<span class={[detached.char, detached.charMark]} data-overlay-logo-char>
									{ch}
								</span>
							</span>
						))}
						{LOGO_SUFFIX.split('').map((ch, i) => (
							<span key={`s-${i}-${ch}`} class={detached.logoClip}>
								<span class={[detached.char, detached.charSuffix]} data-overlay-logo-char>
									{ch}
								</span>
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

	async leave(_context: PageTransitionContext) {
		if (!this.overlay) return;

		const root = this.overlay.refs.root.value;
		const logoBox = this.overlay.refs.logoBox.value;
		const blobs = [
			this.overlay.refs.blobA.value,
			this.overlay.refs.blobB.value,
			this.overlay.refs.blobC.value,
			this.overlay.refs.blobD.value,
			this.overlay.refs.blobE.value,
		].filter(Boolean) as HTMLElement[];
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
		//
	}

	cleanup() {
		this.overlay?.destroy();
		this.overlay = undefined;
	}
}

export const overlayTransition = new OverlayTransitionClass();
