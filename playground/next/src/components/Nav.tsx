'use client';

import { FlyvaLink } from '@flyva/next';
import { usePathname } from 'next/navigation';

export function Nav() {
	const pathname = usePathname();

	return (
		<nav className="nav">
			<span className="nav-logo">flyva<span className="nav-logo-tag">:next</span></span>
			<div className="nav-links">
				<FlyvaLink href="/" className={pathname === '/' ? 'active' : ''}>
					Home
				</FlyvaLink>

				<FlyvaLink href="/about" className={pathname === '/about' ? 'active' : ''}>
					About <span className="nav-badge">default</span>
				</FlyvaLink>

				<FlyvaLink
					href="/work"
					flyvaTransition="slideTransition"
					className={pathname.startsWith('/work') ? 'active' : ''}
				>
					Work <span className="nav-badge">slide</span>
				</FlyvaLink>

			<FlyvaLink
				href="/css-demo"
				flyvaTransition="cssFadeTransition"
				className={pathname === '/css-demo' ? 'active' : ''}
			>
				CSS Mode <span className="nav-badge">css</span>
			</FlyvaLink>

		<FlyvaLink
			href="/overlay"
			flyvaTransition="overlayTransition"
			className={pathname === '/overlay' ? 'active' : ''}
		>
			Overlay <span className="nav-badge">detached</span>
		</FlyvaLink>

		<FlyvaLink
			href="/lifecycle-demo"
			className={pathname === '/lifecycle-demo' ? 'active' : ''}
		>
			Lifecycle <span className="nav-badge">hooks</span>
		</FlyvaLink>

		<FlyvaLink
			href="/about"
			flyva={false}
			className={pathname === '/about' ? 'active' : ''}
		>
			About <span className="nav-badge">bypass</span>
		</FlyvaLink>
		</div>
		</nav>
	);
}
