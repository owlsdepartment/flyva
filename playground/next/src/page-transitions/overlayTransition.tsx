'use client';

import { createTimeline } from 'animejs';
import { type RefObject } from 'react';

import { useDetachedRoot, type DetachedRoot } from '@flyva/next';
import type { PageTransition, PageTransitionContext } from '@flyva/shared';

import detached from './OverlayDetached.module.scss';

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
const LOGO_SUFFIX = ':next';

function appRootEl(): Element | null {
	return document.querySelector('.flyva-root') ?? document.querySelector('[data-flyva-content]');
}

function refEl<T extends HTMLElement>(r: RefObject<T | null>): T | null {
	return r.current;
}

function logoChars(logoBox: HTMLElement | null): HTMLElement[] {
	if (!logoBox) return [];
	return [...logoBox.querySelectorAll<HTMLElement>('[data-overlay-logo-char]')];
}

class OverlayTransitionClass implements PageTransition {
	private overlay: DetachedRoot<OverlayRefs> | undefined;

	async prepare() {
		this.overlay = useDetachedRoot(refs => (
			<div className={detached.overlay} ref={refs.root}>
				<div className={detached.blobs}>
					<span className={detached.blobA} ref={refs.blobA}>
						<span className={detached.drift}>
							<span className={detached.glow} />
						</span>
					</span>
					<span className={detached.blobB} ref={refs.blobB}>
						<span className={detached.drift}>
							<span className={detached.glow} />
						</span>
					</span>
					<span className={detached.blobC} ref={refs.blobC}>
						<span className={detached.drift}>
							<span className={detached.glow} />
						</span>
					</span>
					<span className={detached.blobD} ref={refs.blobD}>
						<span className={detached.drift}>
							<span className={detached.glow} />
						</span>
					</span>
					<span className={detached.blobE} ref={refs.blobE}>
						<span className={detached.drift}>
							<span className={detached.glow} />
						</span>
					</span>
				</div>
				<div className={detached.logo} ref={refs.logoBox}>
					<span className={detached.logoStack}>
						{LOGO_MARK.split('').map((ch, i) => (
							<span key={`m-${i}-${ch}`} className={detached.logoClip}>
								<span
									className={`${detached.char} ${detached.charMark}`}
									data-overlay-logo-char
								>
									{ch}
								</span>
							</span>
						))}
						{LOGO_SUFFIX.split('').map((ch, i) => (
							<span key={`s-${i}-${ch}`} className={detached.logoClip}>
								<span
									className={`${detached.char} ${detached.charSuffix}`}
									data-overlay-logo-char
								>
									{ch}
								</span>
							</span>
						))}
					</span>
				</div>
			</div>
		));

		await this.overlay.waitForRender();

		const root = refEl(this.overlay.refs.root);
		if (root) {
			root.style.visibility = 'visible';
			root.style.opacity = '0';
		}
		for (const k of ['blobA', 'blobB', 'blobC', 'blobD', 'blobE'] as const) {
			const el = refEl(this.overlay.refs[k]);
			if (el) el.style.opacity = '0';
		}
		const logoBox = refEl(this.overlay.refs.logoBox);
		for (const ch of logoChars(logoBox)) {
			ch.style.transform = 'translateY(1.12em)';
		}
	}

	beforeLeave(_context: PageTransitionContext) {
		document.body.classList.add('flyva-transition-active');
	}

	async leave(_context: PageTransitionContext) {
		if (!this.overlay) return;

		const root = refEl(this.overlay.refs.root);
		const logoBox = refEl(this.overlay.refs.logoBox);
		const blobs = [
			refEl(this.overlay.refs.blobA),
			refEl(this.overlay.refs.blobB),
			refEl(this.overlay.refs.blobC),
			refEl(this.overlay.refs.blobD),
			refEl(this.overlay.refs.blobE),
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

		const root = refEl(this.overlay.refs.root);
		const blobs = [
			refEl(this.overlay.refs.blobA),
			refEl(this.overlay.refs.blobB),
			refEl(this.overlay.refs.blobC),
			refEl(this.overlay.refs.blobD),
			refEl(this.overlay.refs.blobE),
		].filter(Boolean) as HTMLElement[];
		const logoBox = refEl(this.overlay.refs.logoBox);
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
