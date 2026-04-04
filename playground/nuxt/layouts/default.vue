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
					to="/overlay"
					flyva-transition="overlayTransition"
					:class="{ active: $route.path === '/overlay' }"
				>
					Overlay <span class="nav-badge">detached</span>
				</FlyvaLink>
			</div>
		</nav>

		<main class="app-wrapper" data-flyva-content>
			<slot />
		</main>
	</div>
</template>
