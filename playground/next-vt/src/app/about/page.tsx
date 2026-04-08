export default function About() {
	return (
		<div className="page">
			<div className="page-content">
				<section className="section">
					<h1>About</h1>
					<p>
						You arrived here via the <strong>VT + CSS fade</strong> transition.
						The browser captured old and new snapshots and crossfaded between them
						using <code>::view-transition-old(main)</code> /{' '}
						<code>::view-transition-new(main)</code> CSS rules.
					</p>
				</section>

				<section className="section">
					<div className="card-grid">
						{['Seamless', 'Composable', 'Framework-agnostic'].map((label) => (
							<div key={label} className="card">
								<h3>{label}</h3>
								<p>
									Flyva provides a {label.toLowerCase()} transition layer
									between pages.
								</p>
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
