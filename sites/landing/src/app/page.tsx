import styles from './page.module.css';

const DEFAULT_GITHUB = 'https://github.com/owlsdepartment/flyva';

export default function HomePage() {
	const prefix = process.env.NEXT_PUBLIC_SITE_PREFIX ?? '';
	const docsGettingStarted = `${prefix}/docs/guide/getting-started`;
	const githubUrl = process.env.GITHUB_URL ?? process.env.NEXT_PUBLIC_GITHUB_URL ?? DEFAULT_GITHUB;

	return (
		<main className={styles.root}>
			<div className={styles.logo} role="presentation">
				<img
					className={styles.logoImg}
					src={`${prefix}/flyva-logo.svg`}
					alt=""
					width={207}
					height={111}
					decoding="async"
				/>
			</div>
			<h1 className={styles.title}>flyva</h1>
			<p className={styles.tagline}>
				The ultimate context-aware page transitions system for{' '}
				<span className={styles.taglineNext}>Next.js</span> and{' '}
				<span className={styles.taglineNuxt}>Nuxt</span>.
			</p>
			<p className={styles.desc}>
				A missing piece in a creative developer&apos;s toolkit for React and Vue.
			</p>
			<div className={styles.actions}>
				<a className={`${styles.btn} ${styles.btnPrimary}`} href={docsGettingStarted}>
					Getting started
				</a>
				<a
					className={`${styles.btn} ${styles.btnGhost}`}
					href={githubUrl}
					rel="noopener noreferrer"
					target="_blank"
				>
					Github
				</a>
			</div>

			<p className={styles.credits}>
				MIT License, created by <a href="https://owlsdepartment.com">Owls Department</a> in Cracow{' '}
				{'<3'}
			</p>
		</main>
	);
}
