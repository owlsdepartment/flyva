import { animate, createTimeline } from 'animejs';

import type {
	PageTransition,
	PageTransitionContext,
} from '@flyva/shared';

class ExpandTransitionClass implements PageTransition {
	private content: HTMLElement | null = null;
	private clone: HTMLElement | null = null;
	private triggerEl: Element | null = null;
	private snapshot: DOMRect | null = null;

	async prepare(context: PageTransitionContext) {
		this.content = document.querySelector('[data-flyva-content]');

		if (context.el) {
			this.triggerEl = context.el;
			this.snapshot = context.el.getBoundingClientRect();
		}
	}

	beforeLeave() {
		if (!this.content || !this.snapshot || !this.triggerEl) return;

		document.body.classList.add('flyva-transition-active');
		this.content.style.pointerEvents = 'none';

		const clone = this.triggerEl.cloneNode(true) as HTMLElement;
		clone.classList.add('flyva-clone');
		clone.style.position = 'fixed';
		clone.style.zIndex = '10000';
		clone.style.top = `${this.snapshot.top}px`;
		clone.style.left = `${this.snapshot.left}px`;
		clone.style.width = `${this.snapshot.width}px`;
		clone.style.height = `${this.snapshot.height}px`;
		clone.style.margin = '0';
		clone.style.transition = 'none';
		clone.style.pointerEvents = 'none';
		clone.style.overflow = 'hidden';
		clone.style.boxSizing = 'border-box';

		document.body.appendChild(clone);
		this.clone = clone;
	}

	async leave() {
		if (!this.content || !this.clone) return;

		const page = this.content.querySelector('[data-demo-page-content]') ?? this.content;
		const pageRect = page.getBoundingClientRect();
		const pageStyle = getComputedStyle(page);
		const padTop = parseFloat(pageStyle.paddingTop) || 0;
		const padLeft = parseFloat(pageStyle.paddingLeft) || 0;
		const padRight = parseFloat(pageStyle.paddingRight) || 0;

		const navEl = document.querySelector('[data-demo-nav]');
		const navHeight = navEl?.getBoundingClientRect().height ?? 0;

		const targetTop = navHeight + padTop;
		const targetLeft = pageRect.left + padLeft;
		const targetWidth = pageRect.width - padLeft - padRight;

		const cloneH3 = this.clone.querySelector('h3');
		const cloneP = this.clone.querySelector('p');

		const tl = createTimeline()
			.add(this.content, {
				opacity: 0,
				duration: 300,
				ease: 'inQuad',
			}, 0)
			.add(this.clone, {
				top: `${targetTop}px`,
				left: `${targetLeft}px`,
				width: `${targetWidth}px`,
				height: '184px',
				padding: '48px 40px',
				borderRadius: '8px',
				duration: 500,
				ease: 'inOutCubic',
			}, 0);

		if (cloneH3) {
			tl.add(cloneH3, {
				fontSize: '36px',
				duration: 500,
				ease: 'inOutCubic',
			}, 0);
		}

		if (cloneP) {
			tl.add(cloneP, {
				fontSize: '16px',
				color: 'rgb(110, 231, 183)',
				duration: 500,
				ease: 'inOutCubic',
			}, 0);
		}

		await tl;
	}

	afterLeave() {
		if (this.content) {
			this.content.style.pointerEvents = '';
		}
	}

	beforeEnter() {
		this.content = document.querySelector('[data-flyva-content]');
		if (!this.content) return;

		this.content.style.opacity = '0';
	}

	async enter() {
		if (!this.content) return;

		const hero = this.content.querySelector('[data-work-hero]');

		if (this.clone && hero) {
			const heroRect = hero.getBoundingClientRect();
			await createTimeline()
				.add(this.clone, {
					top: `${heroRect.top}px`,
					left: `${heroRect.left}px`,
					width: `${heroRect.width}px`,
					height: `${heroRect.height}px`,
					duration: 250,
					ease: 'outCubic',
				}, 0)
				.add(this.clone, { opacity: 0, duration: 200, ease: 'inQuad' }, 250)
				.add(this.content!, { opacity: 1, duration: 200, ease: 'outQuad' }, 250);
		} else {
			await animate(this.content, { opacity: 1, duration: 400, ease: 'outQuad' });
		}
	}

	afterEnter() {
		document.body.classList.remove('flyva-transition-active');
		this.clone?.remove();
	}

	cleanup() {
		this.clone?.remove();
		this.clone = null;
		this.content = null;
		this.triggerEl = null;
		this.snapshot = null;
	}
}

export const expandTransition = new ExpandTransitionClass();
