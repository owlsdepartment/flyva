'use client';

import { useEffect, useState } from 'react';

import { FlyvaLink } from '@flyva/next';
import { usePathname } from 'next/navigation';

const docsHref = process.env.NEXT_PUBLIC_DEMO_DOCS_HREF ?? 'https://flyva.js.org/docs/guide/getting-started';
const githubHref = process.env.NEXT_PUBLIC_DEMO_GITHUB_HREF ?? 'https://github.com/owlsdepartment/flyva';

export function Nav() {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		setMenuOpen(false);
	}, [pathname]);

	useEffect(() => {
		if (!menuOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setMenuOpen(false);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [menuOpen]);

	return (
		<nav className="nav">
			<FlyvaLink href="/" className="nav-logo-link">
				<span className="nav-logo">
					flyva<span className="nav-logo-tag">:next-vt</span>
				</span>
			</FlyvaLink>

			<button
				type="button"
				className="nav-burger"
				aria-expanded={menuOpen}
				aria-controls="demo-nav-links-panel"
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				onClick={() => setMenuOpen((o) => !o)}
			>
				<span className="nav-burger-bar" />
				<span className="nav-burger-bar" />
				<span className="nav-burger-bar" />
			</button>

			{menuOpen ? (
				<button
					type="button"
					className="nav-backdrop"
					aria-label="Close menu"
					tabIndex={-1}
					onClick={() => setMenuOpen(false)}
				/>
			) : null}

			<div id="demo-nav-links-panel" className={`nav-links-panel ${menuOpen ? 'nav-links-panel-open' : ''}`}>
				<div className="nav-links">
					<FlyvaLink href="/" className={pathname === '/' ? 'active' : ''}>
						Home <span className="nav-badge">css fade</span>
					</FlyvaLink>

					<FlyvaLink href="/about" className={pathname === '/about' ? 'active' : ''}>
						About <span className="nav-badge">css fade</span>
					</FlyvaLink>

					<FlyvaLink
						href="/work"
						flyvaTransition="slideVtTransition"
						className={pathname.startsWith('/work') ? 'active' : ''}
					>
						Work <span className="nav-badge">js slide</span>
					</FlyvaLink>

					<div className="nav-links-tail">
						<a className="nav-outline-btn" href={docsHref} rel="noopener noreferrer" target="_blank">
							Docs
						</a>
						<a className="nav-outline-btn" href={githubHref} rel="noopener noreferrer" target="_blank">
							GitHub
						</a>
					</div>
				</div>
			</div>
		</nav>
	);
}
