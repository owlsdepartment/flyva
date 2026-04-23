'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlyvaLink, useFlyvaLifecycle } from '@flyva/next';
import type { PageTransitionContext } from '@flyva/shared';
import { animate } from 'animejs';

function PassiveLogger() {
	const [log, setLog] = useState<string[]>([]);

	useFlyvaLifecycle({
		beforeLeave(ctx) { setLog(prev => [...prev, `beforeLeave → ${ctx.name}`]); },
		leave(ctx) { setLog(prev => [...prev, `leave → ${ctx.name}`]); },
		afterLeave(ctx) { setLog(prev => [...prev, `afterLeave → ${ctx.name}`]); },
		beforeEnter(ctx) { setLog(prev => [...prev, `beforeEnter → ${ctx.name}`]); },
		enter(ctx) { setLog(prev => [...prev, `enter → ${ctx.name}`]); },
		afterEnter(ctx) { setLog(prev => [...prev, `afterEnter → ${ctx.name}`]); },
	});

	return (
		<section className="section">
			<h2>Passive mode log</h2>
			<p>Events logged by <code>useFlyvaLifecycle</code> (passive, fire-and-forget).</p>
			<div className="lifecycle-log">
				{log.length === 0 && <div className="lifecycle-log-entry">Navigate to see events...</div>}
				{log.map((entry, i) => (
					<div key={i} className="lifecycle-log-entry">
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

	useFlyvaLifecycle({
		async leave() {
			if (!barRef.current) return;
			barRef.current.style.width = '0%';
			await animate(barRef.current, {
				width: '60%',
				duration: 400,
				ease: 'outQuad',
			});

			await new Promise((resolve) => setTimeout(resolve, 500));

			await animate(barRef.current, {
				width: '100%',
				duration: 300,
				ease: 'outQuad',
			});
		},
	}, { active: true });

	return (
		<section className="section">
			<h2>Active mode progress bar</h2>
			<p>
				A progress bar animated via <code>useFlyvaLifecycle</code> in active mode.
				The transition awaits this animation before proceeding. The bar is portaled to{' '}
				<code>{'<body>'}</code> so the page fade does not affect its opacity.
			</p>
			{mounted
				? createPortal(
					<div className="lifecycle-progress-float">
						<div className="lifecycle-progress">
							<div ref={barRef} className="lifecycle-progress-bar" />
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

			<section className="section">
				<h2>FlyvaLink callback props</h2>
				<p>
					Indicator turns on at <code>onBeforeLeave</code> and off at{' '}
					<code>onAfterEnter</code>.
					<span className={`lifecycle-indicator${indicator ? ' lifecycle-indicator--active' : ''}`} />
				</p>
				<FlyvaLink
					href="/about"
					onBeforeLeave={() => setIndicator(true)}
					onAfterEnter={() => setIndicator(false)}
				>
					Go to About (with indicator)
				</FlyvaLink>
			</section>

			<section className="section">
				<h2>Lifecycle classes on {'<html>'}</h2>
				<p>
					<code>flyva-running</code> stays on for the whole swap. Phase tokens{' '}
					<code>flyva-leave-*</code> / <code>flyva-enter-*</code> follow Vue-style
					steps; <code>flyva-pending</code> covers the gap after leave hooks and
					before enter (so the nav border animation never drops).{' '}
					<code>data-flyva-transition</code> on <code>{'<html>'}</code> is the transition
					key (e.g. <code>overlayTransition</code>) — the playground hides the nav bar
					shimmer for overlay. <code>flyva-transition-active</code> on{' '}
					<code>{'<body>'}</code> is separate (overlay) from those lifecycle hooks.
				</p>
			</section>
		</>
	);
}
