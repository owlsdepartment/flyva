<script setup lang="ts">
const route = useRoute();
const { demoDocsHref, demoGithubHref } = useRuntimeConfig().public;

const menuOpen = ref(false);

watch(
	() => route.path,
	() => {
		menuOpen.value = false;
	},
);

watchEffect((onCleanup) => {
	if (!menuOpen.value || !import.meta.client) return;
	const onKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape') menuOpen.value = false;
	};
	window.addEventListener('keydown', onKey);
	onCleanup(() => window.removeEventListener('keydown', onKey));
});
</script>

<template>
	<div>
		<nav class="nav">
			<FlyvaLink to="/" class="nav-logo-link">
				<span class="nav-logo">flyva<span class="nav-logo-tag">:nuxt-vt</span></span>
			</FlyvaLink>

			<button
				type="button"
				class="nav-burger"
				:aria-expanded="menuOpen"
				aria-controls="demo-nav-links-panel"
				:aria-label="menuOpen ? 'Close menu' : 'Open menu'"
				@click="menuOpen = !menuOpen"
			>
				<span class="nav-burger-bar" />
				<span class="nav-burger-bar" />
				<span class="nav-burger-bar" />
			</button>

			<button
				v-if="menuOpen"
				type="button"
				class="nav-backdrop"
				aria-label="Close menu"
				tabindex="-1"
				@click="menuOpen = false"
			/>

			<div id="demo-nav-links-panel" class="nav-links-panel" :class="{ 'nav-links-panel-open': menuOpen }">
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
						<a class="nav-outline-btn" :href="demoDocsHref" rel="noopener noreferrer" target="_blank">Docs</a>
						<a class="nav-outline-btn" :href="demoGithubHref" rel="noopener noreferrer" target="_blank">GitHub</a>
					</div>
				</div>
			</div>
		</nav>

		<main class="app-wrapper" data-flyva-content>
			<slot />
		</main>
	</div>
</template>
