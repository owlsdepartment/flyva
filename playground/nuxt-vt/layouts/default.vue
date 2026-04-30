<script setup lang="ts">
const { demoDocsHref, demoGithubHref } = useRuntimeConfig().public;
</script>

<template>
	<div>
		<nav class="nav">
			<span class="nav-logo">flyva<span class="nav-logo-tag">:nuxt-vt</span></span>
			<div class="nav-links">
				<FlyvaLink to="/" :class="{ active: $route.path === '/' }">
					Home <span class="nav-badge">css fade</span>
				</FlyvaLink>

				<FlyvaLink to="/about" :class="{ active: $route.path === '/about' }">
					About <span class="nav-badge">css fade</span>
				</FlyvaLink>

				<FlyvaLink
					to="/work"
					flyva-transition="slideVtTransition"
					:class="{ active: $route.path.startsWith('/work') }"
				>
					Work <span class="nav-badge">js slide</span>
				</FlyvaLink>

				<div class="nav-links-tail">
					<a class="nav-external" :href="demoDocsHref" rel="noopener noreferrer" target="_blank">Docs</a>
					<a class="nav-external" :href="demoGithubHref" rel="noopener noreferrer" target="_blank">GitHub</a>
				</div>
			</div>
		</nav>

		<main class="app-wrapper" data-flyva-content>
			<slot />
		</main>
	</div>
</template>
