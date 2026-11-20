import type {
	OutgoingContext,
	OutgoingHook,
	PageTransitionContext,
	PageTransitionOptions,
} from './page-transition-manager/types';

function mapCounterparts(source: Element, target: Element): WeakMap<Element, Element> {
	const map = new WeakMap<Element, Element>([[source, target]]);
	const sourceWalker = document.createTreeWalker(source, NodeFilter.SHOW_ELEMENT);
	const targetWalker = document.createTreeWalker(target, NodeFilter.SHOW_ELEMENT);

	let live = sourceWalker.nextNode();
	let copy = targetWalker.nextNode();
	while (live && copy) {
		map.set(live as Element, copy as Element);
		live = sourceWalker.nextNode();
		copy = targetWalker.nextNode();
	}

	return map;
}

/**
 * Builds an {@link OutgoingContext}. Counterparts are mapped eagerly, so `target` must still be an
 * untouched `cloneNode(true)` of `source` (or `source` itself) when this is called.
 */
export function createOutgoingContext<O = PageTransitionOptions>(
	base: PageTransitionContext<O>,
	source: HTMLElement,
	target: HTMLElement,
): OutgoingContext<O> {
	const isClone = source !== target;
	const map = isClone ? mapCounterparts(source, target) : undefined;

	function counterpart<T extends Element>(live: T): T | null {
		if (!map) return source.contains(live) ? live : null;
		return (map.get(live) as T | undefined) ?? null;
	}

	function pairs<T extends Element = HTMLElement>(selector: string): Array<[T, T]> {
		const result: Array<[T, T]> = [];
		for (const live of Array.from(source.querySelectorAll(selector))) {
			const copy = counterpart(live);
			if (copy) result.push([live as T, copy as T]);
		}
		return result;
	}

	return {
		...base,
		current: target,
		container: target,
		source,
		target,
		isClone,
		counterpart,
		pairs,
	};
}

type StyledElement = Element & ElementCSSInlineStyle;

function hasInlineStyle(el: Element): el is StyledElement {
	return 'style' in el;
}

function splitList(value: string) {
	return value.split(',').map(item => item.trim());
}

function collectCssAnimations(root: Element) {
	const byTarget = new Map<Element, CSSAnimation[]>();

	for (const animation of root.getAnimations({ subtree: true })) {
		if (!(animation instanceof CSSAnimation)) continue;
		const effect = animation.effect;
		if (!(effect instanceof KeyframeEffect) || effect.pseudoElement || !effect.target) continue;

		const list = byTarget.get(effect.target) ?? [];
		list.push(animation);
		byTarget.set(effect.target, list);
	}

	return byTarget;
}

/**
 * Carries CSS animation progress from `source` over to the cloned `target`: running animations are
 * offset with a negative `animation-delay` so the paused clone shows the same frame, and finished
 * animations get `animation-name: none` so the clone keeps their end state instead of restarting.
 * Scroll-driven animations are left untouched. No-op when the outgoing content is not a clone.
 */
export function freezeAnimations(): OutgoingHook {
	return ({ source, isClone, counterpart }) => {
		if (
			!isClone ||
			typeof source.getAnimations !== 'function' ||
			typeof CSSAnimation === 'undefined'
		) {
			return;
		}

		const running = collectCssAnimations(source);

		for (const live of [source, ...Array.from(source.querySelectorAll('*'))]) {
			const computed = getComputedStyle(live);
			if (!computed.animationName || computed.animationName === 'none') continue;

			const copy = counterpart(live);
			if (!copy || !hasInlineStyle(copy)) continue;

			const animations = running.get(live) ?? [];
			const names = splitList(computed.animationName);
			const delays = splitList(computed.animationDelay);

			names.forEach((name, slot) => {
				const animation = animations.find(item => item.animationName === name);
				if (!animation) {
					names[slot] = 'none';
					return;
				}
				if (animation.timeline !== document.timeline) return;

				const delay = Number(animation.effect?.getTiming().delay ?? 0);
				delays[slot] = `${delay - Number(animation.currentTime ?? 0)}ms`;
			});

			copy.style.animationName = names.join(', ');
			copy.style.animationDelay = delays.join(', ');
		}
	};
}

export interface FreezeMediaOptions {
	/** Elements to snapshot (default `video, canvas`). */
	selector?: string;
	/** Only snapshot elements intersecting the viewport (default `true`). */
	inViewport?: boolean;
	/** Computed style properties copied from the live element onto its snapshot. */
	styleProps?: readonly string[];
}

const DEFAULT_SNAPSHOT_STYLE_PROPS = [
	'position',
	'inset',
	'width',
	'height',
	'z-index',
	'object-fit',
	'object-position',
	'transform',
	'opacity',
] as const;

function isInViewport(el: Element) {
	const rect = el.getBoundingClientRect();
	return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
}

function snapshotMediaElement(
	live: HTMLVideoElement | HTMLCanvasElement,
	styleProps: readonly string[],
): HTMLCanvasElement | undefined {
	const isVideo = live instanceof HTMLVideoElement;
	const width = isVideo ? live.videoWidth : live.width;
	const height = isVideo ? live.videoHeight : live.height;
	if (!width || !height) return;

	const isSeeking = isVideo && live.seeking;
	if (isVideo && !isSeeking && live.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

	const snapshot = document.createElement('canvas');
	snapshot.width = width;
	snapshot.height = height;

	const draw = () => snapshot.getContext('2d')?.drawImage(live, 0, 0, width, height);
	if (isSeeking) live.addEventListener('seeked', draw, { once: true });
	else draw();

	if (live.className) snapshot.className = live.className;
	snapshot.setAttribute('aria-hidden', 'true');

	const computed = getComputedStyle(live);
	for (const prop of styleProps) {
		snapshot.style.setProperty(prop, computed.getPropertyValue(prop));
	}
	snapshot.style.display = 'block';

	return snapshot;
}

/**
 * Replaces videos and canvases in the cloned `target` with canvases painted from their live
 * counterparts (clones lose video frames and canvas pixels). Seeking videos are painted once the
 * seek settles. No-op when the outgoing content is not a clone.
 */
export function freezeMedia(options: FreezeMediaOptions = {}): OutgoingHook {
	const selector = options.selector ?? 'video, canvas';
	const inViewport = options.inViewport ?? true;
	const styleProps = options.styleProps ?? DEFAULT_SNAPSHOT_STYLE_PROPS;

	return ({ isClone, pairs }) => {
		if (!isClone) return;

		for (const [live, copy] of pairs<Element>(selector)) {
			if (!(live instanceof HTMLVideoElement || live instanceof HTMLCanvasElement)) continue;
			if (inViewport && !isInViewport(live)) continue;

			const snapshot = snapshotMediaElement(live, styleProps);
			if (snapshot) copy.replaceWith(snapshot);
		}
	};
}
