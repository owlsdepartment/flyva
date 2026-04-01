export default function About() {
	return (
		<div className="page">
			<section className="section">
				<h1>About</h1>
				<p>
					You arrived here via the <strong>default fade transition</strong>.
					No <code>flyvaTransition</code> prop was set on the link — it
					resolved to <code>defaultTransition</code> automatically.
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
	);
}
