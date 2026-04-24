<script setup lang="ts">
import DemoCardGrid from '~/components/demo/DemoCardGrid.vue';
import DemoPage from '~/components/demo/DemoPage.vue';
import DemoSection from '~/components/demo/DemoSection.vue';
import DemoWorkCardLink from '~/components/demo/DemoWorkCardLink.vue';

const projects = [
	{ slug: 'alpha', title: 'Project Alpha', description: 'A branding & identity system for a fintech startup.' },
	{ slug: 'beta', title: 'Project Beta', description: 'E-commerce platform redesign with headless CMS.' },
	{ slug: 'gamma', title: 'Project Gamma', description: 'Interactive data dashboard for climate research.' },
	{ slug: 'delta', title: 'Project Delta', description: 'Mobile-first social platform for local communities.' },
];
</script>

<template>
	<DemoPage>
		<DemoSection>
			<h1>Work</h1>
			<p>
				Click a project card below — the card will <strong>expand</strong> into the detail view using a FLIP-style shared element
				transition.
			</p>
		</DemoSection>

		<DemoSection>
			<DemoCardGrid>
				<DemoWorkCardLink v-for="project in projects" :key="project.slug" :to="`/work/${project.slug}`" :card-id="project.slug">
					<h3>{{ project.title }}</h3>
					<p>{{ project.description }}</p>
				</DemoWorkCardLink>
			</DemoCardGrid>
		</DemoSection>
	</DemoPage>
</template>
