import { FlyvaLink } from '@flyva/next';

import demo from '@/styles/demo-pages.module.scss';

const SECTIONS = Array.from({ length: 8 }, (_, i) => i + 1);

export default function ScrollDemo() {
	return (
		<div className={demo.page}>
			<div className={demo.pageContent} data-demo-page-content>
				<section className={demo.section}>
					<h1>Scroll</h1>
					<p>
						<code>config.scroll</code> is on: Flyva switches the browser to manual restoration, saves the position of
						every history entry and applies it during the transition — top (or the link&apos;s hash) on push, the saved
						position on back / forward and reload.
					</p>
					<p>
						Jump to{' '}
						{SECTIONS.map(n => (
							<a key={n} href={`#section-${n}`} style={{ marginRight: '0.75em' }}>
								#{n}
							</a>
						))}
					</p>
					<p>
						<FlyvaLink href="/about">About</FlyvaLink>
					</p>
				</section>

				{SECTIONS.map(n => (
					<section key={n} id={`section-${n}`} className={demo.section} style={{ minHeight: '70vh' }}>
						<h2>Section {n}</h2>
						<p>Scroll somewhere, navigate away and come back with the browser buttons.</p>
					</section>
				))}
			</div>
		</div>
	);
}
