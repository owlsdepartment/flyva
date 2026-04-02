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
						Click a project card below — the card will <strong>expand</strong> into
						the detail view using a FLIP-style shared element transition.
					</p>
				</section>

				<section className="section">
					<div className="card-grid">
						{projects.map(({ slug, title, description }) => (
							<FlyvaLink
								key={slug}
								href={`/work/${slug}`}
								flyvaTransition="expandTransition"
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
