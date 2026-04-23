<script setup lang="ts">
</script>

<template>
	<div>
		<nav class="nav">
			<span class="nav-logo">flyva<span class="nav-logo-tag">:nuxt</span></span>
			<div class="nav-links">
				<FlyvaLink to="/" :class="{ active: $route.path === '/' }">
					Home
				</FlyvaLink>

				<FlyvaLink to="/about" :class="{ active: $route.path === '/about' }">
					About <span class="nav-badge">default</span>
				</FlyvaLink>

				<FlyvaLink
					to="/work"
					flyva-transition="slideTransition"
					:class="{ active: $route.path.startsWith('/work') }"
				>
					Work <span class="nav-badge">slide</span>
				</FlyvaLink>

				<FlyvaLink
					to="/css-demo"
					flyva-transition="cssFadeTransition"
					:class="{ active: $route.path === '/css-demo' }"
				>
					CSS Mode <span class="nav-badge">css</span>
				</FlyvaLink>

				<FlyvaLink
					to="/overlay"
					flyva-transition="overlayTransition"
					:class="{ active: $route.path === '/overlay' }"
				>
					Overlay <span class="nav-badge">detached</span>
				</FlyvaLink>

				<FlyvaLink
					to="/lifecycle-demo"
					:class="{ active: $route.path === '/lifecycle-demo' }"
				>
					Lifecycle <span class="nav-badge">hooks</span>
				</FlyvaLink>

				<FlyvaLink
					to="/about"
					:flyva="false"
					:class="{ active: $route.path === '/about' }"
				>
					About <span class="nav-badge">bypass</span>
				</FlyvaLink>
			</div>
		</nav>

		<main class="app-wrapper" data-flyva-content>
			<slot />
		</main>
	</div>
</template>
