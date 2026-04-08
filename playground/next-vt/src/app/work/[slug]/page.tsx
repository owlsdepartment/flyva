'use client';

import { useParams } from 'next/navigation';
import { FlyvaLink } from '@flyva/next';

const projectData: Record<string, { title: string; description: string; body: string }> = {
	alpha: {
		title: 'Project Alpha',
		description: 'A branding & identity system for a fintech startup.',
		body: 'We crafted a comprehensive brand identity including logo, typography system, color palette, and motion guidelines. The project spanned three months and involved close collaboration with stakeholders from product, marketing, and engineering teams.',
	},
	beta: {
		title: 'Project Beta',
		description: 'E-commerce platform redesign with headless CMS.',
		body: 'The platform was rebuilt from the ground up using a composable commerce architecture. We integrated a headless CMS for content management, implemented server-side rendering for SEO, and designed a checkout flow that increased conversion rates by 34%.',
	},
	gamma: {
		title: 'Project Gamma',
		description: 'Interactive data dashboard for climate research.',
		body: 'This dashboard processes and visualizes terabytes of climate data in real-time. Built with WebGL-accelerated charts and a custom tile-rendering engine, it allows researchers to explore temperature, precipitation, and sea-level datasets across decades of recordings.',
	},
	delta: {
		title: 'Project Delta',
		description: 'Mobile-first social platform for local communities.',
		body: 'A hyper-local social network connecting neighbors through events, shared resources, and community boards. We focused on accessibility, offline-first architecture, and a warm, inviting UI that encourages participation from diverse demographics.',
	},
};

export default function WorkDetail() {
	const params = useParams<{ slug: string }>();
	const project = projectData[params.slug] ?? {
		title: 'Unknown Project',
		description: '',
		body: 'This project does not exist.',
	};

	return (
		<div className="page work-detail">
			<div className="page-content">
				<section className="work-detail-hero" data-work-hero>
					<h1>{project.title}</h1>
					<p className="work-detail-intro">{project.description}</p>
				</section>

				<section className="section">
					<p className="work-detail-body">{project.body}</p>
				</section>

				<section className="section">
					<FlyvaLink
						href="/work"
						flyvaTransition="slideVtTransition"
						flyvaOptions={{ direction: 'back' }}
						className="back-link"
					>
						← Back to Work
					</FlyvaLink>
				</section>
			</div>
		</div>
	);
}
