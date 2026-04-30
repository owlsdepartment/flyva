---
title: Demos
description: Live Flyva playgrounds for Next.js and Nuxt, with and without the View Transitions API.
---

<script setup lang="ts">
import { playgroundPath } from './.vitepress/playground-href';

const demos = [
	{
		slug: 'next',
		title: 'Next.js (App Router)',
		description:
			'Default Flyva setup: FlyvaRoot, FlyvaTransitionWrapper, hook-driven transitions, and concurrent mode demos.',
		source: 'https://github.com/owlsdepartment/flyva/tree/main/playground/next',
		run: 'pnpm dev:next',
	},
	{
		slug: 'next-vt',
		title: 'Next.js + View Transitions API',
		description:
			'Same stack with config.viewTransition enabled — document.startViewTransition and VT-oriented transitions.',
		source: 'https://github.com/owlsdepartment/flyva/tree/main/playground/next-vt',
		run: 'pnpm dev:next:vt',
	},
	{
		slug: 'nuxt',
		title: 'Nuxt 4',
		description: 'The @flyva/nuxt module with FlyvaPage, auto-imported composables, and classic JS hook transitions.',
		source: 'https://github.com/owlsdepartment/flyva/tree/main/playground/nuxt',
		run: 'pnpm dev:nuxt',
	},
	{
		slug: 'nuxt-vt',
		title: 'Nuxt + View Transitions API',
		description: 'Nuxt playground with flyva.viewTransition enabled for VT-first flows.',
		source: 'https://github.com/owlsdepartment/flyva/tree/main/playground/nuxt-vt',
		run: 'pnpm dev:nuxt:vt',
	},
];
</script>

# Demos

These builds mirror the monorepo playgrounds deployed under **`/playground/…`** on the main site (sibling to **`/docs/`**, not inside it). Open a card to run the hosted demo in a new tab, or use the root `pnpm` scripts locally.

<div class="vp-demos-card-grid">
	<div v-for="d in demos" :key="d.slug" class="vp-demos-card">
		<a class="vp-demos-card-cta" :href="playgroundPath(d.slug)" target="_blank" rel="noopener noreferrer">
			<h3>{{ d.title }}</h3>
			<p>{{ d.description }}</p>
			<span class="vp-demos-card-cta-label">Open demo →</span>
		</a>
		<ul class="vp-demos-card-meta">
			<li>
				<a :href="d.source" target="_blank" rel="noopener noreferrer">Browse source on GitHub</a>
			</li>
			<li>Run locally: <code>{{ d.run }}</code> (repo root)</li>
		</ul>
	</div>
</div>

---

Full documentation lives under **[Getting started](/guide/getting-started)** in this site.
