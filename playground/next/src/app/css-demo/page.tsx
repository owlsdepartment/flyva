'use client';

import { FlyvaLink } from '@flyva/next';

import demo from '@/styles/demo-pages.module.scss';

export default function CssDemo() {
	return (
		<div className={demo.page}>
			<div className={demo.pageContent} data-demo-page-content>
				<section className={demo.section}>
					<h1>CSS Mode</h1>
					<p>
						These transitions use <code>cssMode: true</code> — Flyva applies Vue-style stage classes (
						<code>*-leave-from</code>, <code>*-leave-active</code>, <code>*-leave-to</code>, etc.) and listens for{' '}
						<code>transitionend</code> / <code>animationend</code> to resolve. No JavaScript animation code needed.
					</p>
				</section>

				<section className={demo.section}>
					<h2>CSS Fade</h2>
					<p>
						A simple opacity crossfade driven entirely by CSS transitions. The transition classes are derived from the key
						name <code>cssFadeTransition</code>.
					</p>
					<div className={demo.cssDemoLinks}>
						<FlyvaLink href="/" flyvaTransition="cssFadeTransition" className={demo.cssDemoBtn}>
							Home (fade)
						</FlyvaLink>
					</div>
				</section>

				<section className={demo.section}>
					<h2>CSS Slide</h2>
					<p>A horizontal slide — the old page moves left and fades while the new page slides in from the right.</p>
					<div className={demo.cssDemoLinks}>
						<FlyvaLink href="/" flyvaTransition="cssSlideTransition" className={demo.cssDemoBtn}>
							Home (slide)
						</FlyvaLink>
					</div>
				</section>

				<section className={demo.section}>
					<h2>How it works</h2>
					<ul className={demo.testList}>
						<li>
							<strong>Transition definition</strong> — just <code>{`{ cssMode: true }`}</code>, no leave/enter hooks
						</li>
						<li>
							<strong>Stage classes</strong> — Flyva adds <code>*-leave-from</code> + <code>*-leave-active</code>, then swaps
							to <code>*-leave-to</code> on the next frame. Same pattern for enter.
						</li>
						<li>
							<strong>Completion</strong> — detected via <code>transitionend</code> / <code>animationend</code> events
						</li>
					</ul>
				</section>
			</div>
		</div>
	);
}
