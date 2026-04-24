<script setup lang="ts">
const navLogoRef = ref<HTMLSpanElement | null>(null);

useFlyvaLifecycle({
	leave() {
		navLogoRef.value?.classList.add('is-expanded');
	},
	enter() {
		navLogoRef.value?.classList.remove('is-expanded');
	},
});
</script>

<template>
	<div>
		<nav class="nav">
			<span ref="navLogoRef" class="nav-logo">
				<span class="nav-logo__flyva">flyva</span>
				<span class="nav-logo__tail">
					<span class="nav-logo__bars" aria-hidden="true">
						<span class="nav-logo__bars-inner">
							<span class="nav-logo__bars-bracket nav-logo__bars-bracket--open">[</span>
							<span class="nav-logo__bars-mid">
								<span class="nav-logo__bars-pipe nav-logo__bars-pipe--1">|</span>
								<span class="nav-logo__bars-pipe nav-logo__bars-pipe--2">|</span>
								<span class="nav-logo__bars-pipe nav-logo__bars-pipe--3">|</span>
							</span>
							<span class="nav-logo__bars-bracket nav-logo__bars-bracket--close">]</span>
						</span>
					</span>
					<span class="nav-logo-tag">:nuxt</span>
				</span>
			</span>
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
					to="/bypass"
					:flyva="false"
					:class="{ active: $route.path === '/bypass' }"
				>
					Bypass <span class="nav-badge">bypass</span>
				</FlyvaLink>
			</div>
		</nav>

		<main class="app-wrapper" data-flyva-content>
			<slot />
		</main>
	</div>
</template>
