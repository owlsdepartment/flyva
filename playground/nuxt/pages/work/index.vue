<script setup lang="ts">
const projects = [
	{ slug: 'alpha', title: 'Project Alpha', description: 'A branding & identity system for a fintech startup.' },
	{ slug: 'beta', title: 'Project Beta', description: 'E-commerce platform redesign with headless CMS.' },
	{ slug: 'gamma', title: 'Project Gamma', description: 'Interactive data dashboard for climate research.' },
	{ slug: 'delta', title: 'Project Delta', description: 'Mobile-first social platform for local communities.' },
];
</script>

<template>
	<div class="page">
		<div class="page-content">
			<section class="section">
				<h1>Work</h1>
				<p>
					Click a project card below — the card will <strong>expand</strong> into
					the detail view using a FLIP-style shared element transition.
				</p>
			</section>
	
			<section class="section">
				<div class="card-grid">
					<FlyvaLink
						v-for="project in projects"
						:key="project.slug"
						:to="`/work/${project.slug}`"
						flyva-transition="expandTransition"
						class="work-card"
						:data-work-card="project.slug"
					>
						<h3>{{ project.title }}</h3>
						<p>{{ project.description }}</p>
					</FlyvaLink>
				</div>
			</section>
		</div>
	</div>
</template>
