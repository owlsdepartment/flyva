<script lang="ts" setup>
const route = useRoute();

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

const slug = route.params.slug as string;
const project = projectData[slug] ?? {
	title: 'Unknown Project',
	description: '',
	body: 'This project does not exist.',
};
</script>

<template>
	<div class="page work-detail">
		<div class="page-content">
			<section class="work-detail-hero" data-work-hero>
				<h1>{{ project.title }}</h1>
				<p class="work-detail-intro">{{ project.description }}</p>
			</section>

			<section class="section">
				<p class="work-detail-body">{{ project.body }}</p>
			</section>

			<section class="section">
				<FlyvaLink
					to="/work"
					flyva-transition="slideVtTransition"
					:flyva-options="{ direction: 'back' }"
					class="back-link"
				>
					← Back to Work
				</FlyvaLink>
			</section>
		</div>
	</div>
</template>
