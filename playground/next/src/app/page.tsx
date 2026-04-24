import { HeroBlock } from '@/components/HeroBlock';
import demo from '@/styles/demo-pages.module.scss';

export default function Home() {
	return (
		<div className={demo.page}>
			<div className={demo.pageContent} data-demo-page-content>
				<section className={demo.section}>
					<h1>Home</h1>
					<p>
						Navigate using the links above. The <strong>About</strong> link uses the default fade transition. The{' '}
						<strong>Work</strong> link uses a slide transition selected via <code>flyvaTransition</code> prop on FlyvaLink.
					</p>
				</section>

				<HeroBlock />

				<section className={demo.section}>
					<h2>What&apos;s being tested</h2>
					<ul className={demo.testList}>
						<li>
							<strong>Default transition</strong> — FlyvaLink without explicit transition name falls back to{' '}
							<code>defaultTransition</code>
						</li>
						<li>
							<strong>Transition selection</strong> — FlyvaLink with <code>flyvaTransition=&quot;slideTransition&quot;</code>{' '}
							uses the slide transition
						</li>
						<li>
							<strong>refStack</strong> — The hero block registers itself via <code>useRefStack</code>. The default
							transition accesses it via <code>globalGetRefStackItem</code> and animates it separately during leave
						</li>
					</ul>
				</section>
			</div>
		</div>
	);
}
