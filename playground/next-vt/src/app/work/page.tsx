'use client';

import { FlyvaLink } from '@flyva/next';

const projects = [
	{ slug: 'alpha', title: 'Project Alpha', description: 'A branding & identity system for a fintech startup.' },
	{ slug: 'beta', title: 'Project Beta', description: 'E-commerce platform redesign with headless CMS.' },
	{ slug: 'gamma', title: 'Project Gamma', description: 'Interactive data dashboard for climate research.' },
	{ slug: 'delta', title: 'Project Delta', description: 'Mobile-first social platform for local communities.' },
];

export default function Work() {
	return (
		<div className="page">
			<div className="page-content">
				<section className="section">
					<h1>Work</h1>
					<p>
						Click a project card — the card will animate into the detail hero
						using a <strong>CSS shared element</strong> view transition. The
						<code>viewTransitionNames</code> function dynamically maps the clicked
						card to the <code>hero</code> VT name.
					</p>
				</section>

				<section className="section">
					<div className="card-grid">
						{projects.map(({ slug, title, description }) => (
							<FlyvaLink
								key={slug}
								href={`/work/${slug}`}
								flyvaTransition="sharedElementTransition"
								flyvaOptions={{ slug }}
								className="work-card"
								data-work-card={slug}
							>
								<h3>{title}</h3>
								<p>{description}</p>
							</FlyvaLink>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
