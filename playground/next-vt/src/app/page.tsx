export default function Home() {
	return (
		<div className="page">
			<div className="page-content">
				<section className="section">
					<h1>ViewTransition Playground</h1>
					<p>
						This playground demonstrates Flyva&apos;s native View Transition API
						support. Navigate using the links above to see different VT modes in
						action.
					</p>
				</section>

				<section className="section">
					<h2>Demo transitions</h2>
					<div className="card-grid">
						<div className="card">
							<h3>VT + CSS Fade</h3>
							<p>
								<code>cssMode: true</code> with <code>viewTransitionNames</code>.
								CSS <code>::view-transition-*</code> rules handle the crossfade.
								Used on Home → About navigation.
							</p>
						</div>
						<div className="card">
							<h3>VT + CSS Shared Element</h3>
							<p>
								Dynamic <code>viewTransitionNames</code> per card. The clicked
								work card morphs into the detail hero via CSS VT. Navigate to Work
								and click a project.
							</p>
						</div>
						<div className="card">
							<h3>VT + JS Slide</h3>
							<p>
								<code>animateViewTransition</code> using WAAPI to slide
								<code>::view-transition-old</code> left and
								<code>::view-transition-new</code> in from the right. Used on Work
								link.
							</p>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
