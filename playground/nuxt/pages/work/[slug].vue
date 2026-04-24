<script setup lang="ts">
import DemoBackLink from '~/components/demo/DemoBackLink.vue';
import DemoPage from '~/components/demo/DemoPage.vue';
import DemoSection from '~/components/demo/DemoSection.vue';
import DemoWorkBody from '~/components/demo/DemoWorkBody.vue';
import DemoWorkHero from '~/components/demo/DemoWorkHero.vue';
import DemoWorkIntro from '~/components/demo/DemoWorkIntro.vue';

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
	<DemoPage work-detail>
		<DemoWorkHero>
			<h1>{{ project.title }}</h1>
			<DemoWorkIntro>{{ project.description }}</DemoWorkIntro>
		</DemoWorkHero>

		<DemoSection>
			<DemoWorkBody>{{ project.body }}</DemoWorkBody>
		</DemoSection>

		<DemoSection>
			<DemoBackLink>← Back to Work</DemoBackLink>
		</DemoSection>
	</DemoPage>
</template>
