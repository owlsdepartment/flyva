import demo from '@/styles/demo-pages.module.scss';

export default function About() {
	return (
		<div className={demo.page}>
			<div className={demo.pageContent} data-demo-page-content>
				<section className={demo.section}>
					<h1>About</h1>
					<p>
						You arrived here via the <strong>default fade transition</strong>. No <code>flyvaTransition</code> prop was
						set on the link — it resolved to <code>defaultTransition</code> automatically.
					</p>
				</section>

				<section className={demo.section}>
					<div className={demo.cardGrid}>
						{['Seamless', 'Composable', 'Framework-agnostic'].map((label) => (
							<div key={label} className={demo.card}>
								<h3>{label}</h3>
								<p>Flyva provides a {label.toLowerCase()} transition layer between pages.</p>
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
