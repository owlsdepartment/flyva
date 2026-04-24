import { LifecycleDemo } from './LifecycleDemo';

export default function LifecycleDemoPage() {
	return (
		<div className="page">
			<div className="page-content">
				<section className="section">
					<h1>Lifecycle hooks</h1>
					<p>
						This page demonstrates <code>useFlyvaLifecycle</code> in non-blocking (default) and
						blocking (<code>blocking: true</code>) modes, plus <code>FlyvaLink</code> callback props.
					</p>
				</section>
				<LifecycleDemo />
			</div>
		</div>
	);
}
