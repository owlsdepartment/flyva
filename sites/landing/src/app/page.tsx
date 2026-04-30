const DEFAULT_GITHUB = 'https://github.com/owlsdepartment/flyva';

export default function HomePage() {
	const prefix = process.env.NEXT_PUBLIC_SITE_PREFIX ?? '';
	const docsGettingStarted = `${prefix}/docs/guide/getting-started`;
	const githubUrl = process.env.GITHUB_URL ?? process.env.NEXT_PUBLIC_GITHUB_URL ?? DEFAULT_GITHUB;

	return (
		<main className="lp">
			<h1 className="lp-title">Flyva</h1>
			<p className="lp-tagline">
				The ultimate context-aware page transitions system for Next.js and Nuxt.
			</p>
			<div className="lp-actions">
				<a className="lp-btn lp-btn--primary" href={docsGettingStarted}>
					Getting started
				</a>
				<a className="lp-btn lp-btn--ghost" href={githubUrl} rel="noopener noreferrer" target="_blank">
					Github
				</a>
			</div>
		</main>
	);
}
