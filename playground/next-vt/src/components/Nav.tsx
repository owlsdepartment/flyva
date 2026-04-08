'use client';

import { FlyvaLink } from '@flyva/next';
import { usePathname } from 'next/navigation';

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
			</div>
		</nav>
	);
}
