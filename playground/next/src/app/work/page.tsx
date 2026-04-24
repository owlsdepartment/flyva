'use client';

import { FlyvaLink } from '@flyva/next';

import demo from '@/styles/demo-pages.module.scss';

const projects = [
	{ slug: 'alpha', title: 'Project Alpha', description: 'A branding & identity system for a fintech startup.' },
	{ slug: 'beta', title: 'Project Beta', description: 'E-commerce platform redesign with headless CMS.' },
	{ slug: 'gamma', title: 'Project Gamma', description: 'Interactive data dashboard for climate research.' },
	{ slug: 'delta', title: 'Project Delta', description: 'Mobile-first social platform for local communities.' },
];

export default function Work() {
	return (
		<div className={demo.page}>
			<div className={demo.pageContent} data-demo-page-content>
				<section className={demo.section}>
					<h1>Work</h1>
					<p>
						Click a project card below — the card will <strong>expand</strong> into the detail view using a FLIP-style
						shared element transition.
					</p>
				</section>

				<section className={demo.section}>
					<div className={demo.cardGrid}>
						{projects.map(({ slug, title, description }) => (
							<FlyvaLink
								key={slug}
								href={`/work/${slug}`}
								flyvaTransition="expandTransition"
								className={demo.workCard}
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
