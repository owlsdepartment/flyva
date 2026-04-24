'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlyvaLink, useFlyvaLifecycle } from '@flyva/next';
import type { PageTransitionContext } from '@flyva/shared';
import { animate } from 'animejs';

import demo from '@/styles/demo-pages.module.scss';

import styles from './LifecycleDemo.module.scss';

function PassiveLogger() {
	const [log, setLog] = useState<string[]>([]);

	useFlyvaLifecycle(
		{
			prepare(ctx: PageTransitionContext) {
				setLog((prev) => [...prev, `prepare → ${ctx.name}`]);
			},
			beforeLeave(ctx: PageTransitionContext) {
				setLog((prev) => [...prev, `beforeLeave → ${ctx.name}`]);
			},
			leave(ctx: PageTransitionContext) {
				setLog((prev) => [...prev, `leave → ${ctx.name}`]);
			},
			afterLeave(ctx: PageTransitionContext) {
				setLog((prev) => [...prev, `afterLeave → ${ctx.name}`]);
			},
			beforeEnter(ctx: PageTransitionContext) {
				setLog((prev) => [...prev, `beforeEnter → ${ctx.name}`]);
			},
			enter(ctx: PageTransitionContext) {
				setLog((prev) => [...prev, `enter → ${ctx.name}`]);
			},
			afterEnter(ctx: PageTransitionContext) {
				setLog((prev) => [...prev, `afterEnter → ${ctx.name}`]);
			},
			cleanup() {
				setLog((prev) => [...prev, 'cleanup → —']);
			},
		},
		{
			blocking: false,
		},
	);

	return (
		<section className={demo.section}>
			<h2>Passive mode log</h2>
			<p>Events logged by <code>useFlyvaLifecycle</code> (non-blocking, fire-and-forget).</p>
			<div className={styles.log}>
				{log.length === 0 && <div className={styles.logEntry}>Navigate to see events...</div>}
				{log.map((entry, i) => (
					<div key={i} className={styles.logEntry}>
						<span>{entry.split(' → ')[0]}</span> → {entry.split(' → ')[1]}
					</div>
				))}
			</div>
		</section>
	);
}

function ActiveProgressBar() {
	const barRef = useRef<HTMLDivElement>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useFlyvaLifecycle(
		{
			async leave() {
				const el = barRef.current;
				if (!el) return;
				el.style.width = '0%';
				await animate(el, {
					width: '60%',
					duration: 400,
					ease: 'outQuad',
				});

				await new Promise((resolve) => setTimeout(resolve, 500));

				await animate(el, {
					width: '100%',
					duration: 300,
					ease: 'outQuad',
				});
			},
		},
		{ blocking: true },
	);

	return (
		<section className={demo.section}>
			<h2>Blocking lifecycle (<code>{'{ blocking: true }'}</code>) progress bar</h2>
			<p>
				A progress bar animated via <code>useFlyvaLifecycle</code> with{' '}
				<code>{'{ blocking: true }'}</code> so the transition awaits this animation. The bar is portaled to{' '}
				<code>{'<body>'}</code> so the page fade does not affect its opacity.
			</p>
			{mounted
				? createPortal(
						<div className={styles.progressFloat}>
							<div className={styles.progress}>
								<div ref={barRef} className={styles.progressBar} />
							</div>
						</div>,
						document.body,
					)
				: null}
		</section>
	);
}

export function LifecycleDemo() {
	const [indicator, setIndicator] = useState(false);

	return (
		<>
			<PassiveLogger />
			<ActiveProgressBar />

			<section className={demo.section}>
				<h2>FlyvaLink callback props</h2>
				<p>
					Indicator turns on at <code>onBeforeLeave</code> and off at{' '}
					<code>onAfterEnter</code>.
					<span className={`${styles.indicator} ${indicator ? styles.active : ''}`} />
				</p>
				<FlyvaLink href="/about" onBeforeLeave={() => setIndicator(true)} onAfterEnter={() => setIndicator(false)}>
					Go to About (with indicator)
				</FlyvaLink>
			</section>

			<section className={demo.section}>
				<h2>Lifecycle classes on {'<html>'}</h2>
				<p>
					<code>flyva-running</code> stays on for the whole swap. Phase tokens{' '}
					<code>flyva-leave-*</code> / <code>flyva-enter-*</code> follow Vue-style steps;{' '}
					<code>flyva-pending</code> covers the gap after leave hooks and before enter (so the nav border animation
					never drops). <code>data-flyva-transition</code> on <code>{'<html>'}</code> is the transition key (e.g.{' '}
					<code>overlayTransition</code>) — the playground hides the nav bar shimmer for overlay.{' '}
					<code>flyva-transition-active</code> on <code>{'<body>'}</code> is separate (overlay) from those lifecycle
					hooks.
				</p>
			</section>
		</>
	);
}
