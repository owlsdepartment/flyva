'use client';

import { useRef } from 'react';

import { FlyvaLink, useFlyvaLifecycle } from '@flyva/next';
import { usePathname } from 'next/navigation';

import styles from './Nav.module.scss';

const docsHref = process.env.NEXT_PUBLIC_DEMO_DOCS_HREF ?? 'https://flyva.js.org/docs/guide/getting-started';
const githubHref = process.env.NEXT_PUBLIC_DEMO_GITHUB_HREF ?? 'https://github.com/owlsdepartment/flyva';

export function Nav() {
	const pathname = usePathname();
	const navLogoRef = useRef<HTMLSpanElement>(null);

	useFlyvaLifecycle(
		{
			prepare() {
				navLogoRef.current?.classList.add(styles.expanded);
			},
			cleanup() {
				navLogoRef.current?.classList.remove(styles.expanded);
			},
		},
		{
			blocking: false,
		},
	);

	return (
		<nav className={styles.root} data-demo-nav>
			<span ref={navLogoRef} className={styles.logo}>
				<span className={styles.flyva}>flyva</span>
				<span className={styles.tail}>
					<span className={styles.bars} aria-hidden>
						<span className={styles.barsInner}>
							<span className={`${styles.bracket} ${styles.bracketOpen}`}>[</span>
							<span className={styles.barsMid}>
								<span className={`${styles.pipe} ${styles.pipe1}`}>|</span>
								<span className={`${styles.pipe} ${styles.pipe2}`}>|</span>
								<span className={`${styles.pipe} ${styles.pipe3}`}>|</span>
							</span>
							<span className={`${styles.bracket} ${styles.bracketClose}`}>]</span>
						</span>
					</span>
					<span className={styles.tag}>:next</span>
				</span>
			</span>
			<div className={styles.links}>
				<FlyvaLink href="/" className={`${styles.link} ${pathname === '/' ? styles.linkActive : ''}`}>
					Home
				</FlyvaLink>

				<FlyvaLink
					href="/about"
					className={`${styles.link} ${pathname === '/about' ? styles.linkActive : ''}`}
				>
					About <span className={styles.badge}>default</span>
				</FlyvaLink>

				<FlyvaLink
					href="/work"
					flyvaOptions={{ direction: 'right' }}
					className={`${styles.link} ${pathname.startsWith('/work') ? styles.linkActive : ''}`}
				>
					Work <span className={styles.badge}>slide</span>
				</FlyvaLink>

				<FlyvaLink
					href="/css-demo"
					flyvaTransition="cssFadeTransition"
					className={`${styles.link} ${pathname === '/css-demo' ? styles.linkActive : ''}`}
				>
					CSS Mode <span className={styles.badge}>css</span>
				</FlyvaLink>

				<FlyvaLink
					href="/overlay"
					flyvaTransition="overlayTransition"
					className={`${styles.link} ${pathname === '/overlay' ? styles.linkActive : ''}`}
				>
					Overlay <span className={styles.badge}>detached</span>
				</FlyvaLink>

				<FlyvaLink
					href="/lifecycle-demo"
					className={`${styles.link} ${pathname === '/lifecycle-demo' ? styles.linkActive : ''}`}
				>
					Lifecycle <span className={styles.badge}>hooks</span>
				</FlyvaLink>

				<FlyvaLink
					href="/bypass"
					flyva={false}
					className={`${styles.link} ${pathname === '/bypass' ? styles.linkActive : ''}`}
				>
					Bypass <span className={styles.badge}>bypass</span>
				</FlyvaLink>

				<div className={styles.linkTail}>
					<a className={styles.external} href={docsHref} rel="noopener noreferrer" target="_blank">
						Docs
					</a>
					<a className={styles.external} href={githubHref} rel="noopener noreferrer" target="_blank">
						GitHub
					</a>
				</div>
			</div>
		</nav>
	);
}
