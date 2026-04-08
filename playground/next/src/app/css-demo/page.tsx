'use client';

import { FlyvaLink } from '@flyva/next';

export default function CssDemo() {
	return (
		<div className="page">
			<div className="page-content">
				<section className="section">
					<h1>CSS Mode</h1>
					<p>
						These transitions use <code>cssMode: true</code> — Flyva applies
						Vue-style stage classes (<code>*-leave-from</code>, <code>*-leave-active</code>,
						<code>*-leave-to</code>, etc.) and listens for <code>transitionend</code> /
						<code>animationend</code> to resolve. No JavaScript animation code needed.
					</p>
				</section>

				<section className="section">
					<h2>CSS Fade</h2>
					<p>
						A simple opacity crossfade driven entirely by CSS transitions.
						The transition classes are derived from the key name <code>cssFadeTransition</code>.
					</p>
					<div className="css-demo-links">
						<FlyvaLink href="/" flyvaTransition="cssFadeTransition" className="css-demo-btn">
							Home (fade)
						</FlyvaLink>
						<FlyvaLink href="/about" flyvaTransition="cssFadeTransition" className="css-demo-btn">
							About (fade)
						</FlyvaLink>
					</div>
				</section>

				<section className="section">
					<h2>CSS Slide</h2>
					<p>
						A vertical slide — the old page shifts up and fades while the new page
						slides in from below with a deceleration curve.
					</p>
					<div className="css-demo-links">
						<FlyvaLink href="/" flyvaTransition="cssSlideTransition" className="css-demo-btn">
							Home (slide)
						</FlyvaLink>
						<FlyvaLink href="/about" flyvaTransition="cssSlideTransition" className="css-demo-btn">
							About (slide)
						</FlyvaLink>
					</div>
				</section>

				<section className="section">
					<h2>How it works</h2>
					<ul className="test-list">
						<li>
							<strong>Transition definition</strong> — just <code>{`{ cssMode: true }`}</code>,
							no leave/enter hooks
						</li>
						<li>
							<strong>Stage classes</strong> — Flyva adds <code>*-leave-from</code> +
							<code>*-leave-active</code>, then swaps to <code>*-leave-to</code> on the
							next frame. Same pattern for enter.
						</li>
						<li>
							<strong>Completion</strong> — detected via <code>transitionend</code> /
							<code>animationend</code> events
						</li>
					</ul>
				</section>
			</div>
		</div>
	);
}
