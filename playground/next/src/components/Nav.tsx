'use client';

import { useRef } from 'react';

import { FlyvaLink, useFlyvaLifecycle } from '@flyva/next';
import { usePathname } from 'next/navigation';

export function Nav() {
	const pathname = usePathname();
	const navLogoRef = useRef<HTMLSpanElement>(null);

	useFlyvaLifecycle({
		prepare() {
			navLogoRef.current?.classList.add('is-expanded');
			console.log('prepare')
		},
		cleanup() {
			navLogoRef.current?.classList.remove('is-expanded');
			console.log('cleanup')
		},
	}, {
		blocking: false
	});

	return (
		<nav className="nav">
			<span ref={navLogoRef} className="nav-logo">
				<span className="nav-logo__flyva">flyva</span>
				<span className="nav-logo__tail">
					<span className="nav-logo__bars" aria-hidden>
						<span className="nav-logo__bars-inner">
							<span className="nav-logo__bars-bracket nav-logo__bars-bracket--open">[</span>
							<span className="nav-logo__bars-mid">
								<span className="nav-logo__bars-pipe nav-logo__bars-pipe--1">|</span>
								<span className="nav-logo__bars-pipe nav-logo__bars-pipe--2">|</span>
								<span className="nav-logo__bars-pipe nav-logo__bars-pipe--3">|</span>
							</span>
							<span className="nav-logo__bars-bracket nav-logo__bars-bracket--close">]</span>
						</span>
					</span>
					<span className="nav-logo-tag">:next</span>
				</span>
			</span>
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
			href="/bypass"
			flyva={false}
			className={pathname === '/bypass' ? 'active' : ''}
		>
			Bypass <span className="nav-badge">bypass</span>
		</FlyvaLink>
		</div>
		</nav>
	);
}
