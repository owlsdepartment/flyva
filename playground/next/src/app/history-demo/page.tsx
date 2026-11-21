import { FlyvaLink } from '@flyva/next';

import demo from '@/styles/demo-pages.module.scss';

import { HistorySwitcher } from './HistorySwitcher';

export default function HistoryDemo() {
	return (
		<div className={demo.page}>
			<div className={demo.pageContent} data-demo-page-content>
				<section className={demo.section}>
					<h1>History</h1>
					<p>
						Browser back / forward runs through <code>config.history</code>. Pick a strategy, navigate a few pages
						with the links above, then use the browser buttons. Settings live in <code>sessionStorage</code>.
					</p>
					<ul>
						<li>
							<strong>noop</strong> — the page swaps immediately; only the enter phase runs.
						</li>
						<li>
							<strong>snapshot</strong> — a clone of the old page stays and plays the leave while the new page renders.
						</li>
						<li>
							<strong>intercept</strong> — the event is held back, the leave runs on the live page, then Next navigates.
						</li>
						<li>
							<strong>off</strong> — the strategy function returns <code>false</code>; no transition.
						</li>
					</ul>
					<p>
						Without an override, history moves use regular matching (going back to Work picks the concurrent{' '}
						<code>slideTransition</code>) and fall back to <code>historyTransition</code>, which is marked{' '}
						<code>history: &apos;only&apos;</code>.
					</p>
				</section>

				<section className={demo.section}>
					<HistorySwitcher />
				</section>

				<section className={demo.section}>
					<p>
						<FlyvaLink href="/scroll-demo#section-5">Scroll demo, section 5</FlyvaLink> — a push with a hash lands on
						the anchor once the page is in.
					</p>
				</section>
			</div>
		</div>
	);
}
