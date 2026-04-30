'use client';

import { FlyvaLink } from '@flyva/next';
import { usePathname } from 'next/navigation';

const docsHref = process.env.NEXT_PUBLIC_DEMO_DOCS_HREF ?? 'https://flyva.js.org/docs/guide/getting-started';
const githubHref = process.env.NEXT_PUBLIC_DEMO_GITHUB_HREF ?? 'https://github.com/owlsdepartment/flyva';

export function Nav() {
	const pathname = usePathname();

	return (
		<nav className="nav">
			<span className="nav-logo">flyva<span className="nav-logo-tag">:next-vt</span></span>
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
					<a className="nav-external" href={docsHref} rel="noopener noreferrer" target="_blank">
						Docs
					</a>
					<a className="nav-external" href={githubHref} rel="noopener noreferrer" target="_blank">
						GitHub
					</a>
				</div>
			</div>
		</nav>
	);
}
