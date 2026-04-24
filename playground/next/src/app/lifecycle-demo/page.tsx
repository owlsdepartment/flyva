import demo from '@/styles/demo-pages.module.scss';

import { LifecycleDemo } from './LifecycleDemo';

export default function LifecycleDemoPage() {
	return (
		<div className={demo.page}>
			<div className={demo.pageContent} data-demo-page-content>
				<section className={demo.section}>
					<h1>Lifecycle hooks</h1>
					<p>
						This page demonstrates <code>useFlyvaLifecycle</code> in non-blocking (default) and blocking (
						<code>blocking: true</code>) modes, plus <code>FlyvaLink</code> callback props.
					</p>
				</section>
				<LifecycleDemo />
			</div>
		</div>
	);
}
