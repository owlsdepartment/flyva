<script setup lang="ts">
const route = useRoute();
const navCss = useCssModule();

const navLogoRef = ref<HTMLSpanElement | null>(null);

useFlyvaLifecycle(
	{
		prepare() {
			navLogoRef.value?.classList.add(navCss.expanded);
		},
		cleanup() {
			navLogoRef.value?.classList.remove(navCss.expanded);
		},
	},
	{ blocking: false },
);
</script>

<template>
	<div>
		<nav :class="navCss.root" data-demo-nav>
			<span ref="navLogoRef" :class="navCss.logo">
				<span :class="navCss.flyva">flyva</span>
				<span :class="navCss.tail">
					<span :class="navCss.bars" aria-hidden="true">
						<span :class="navCss.barsInner">
							<span :class="[navCss.bracket, navCss.bracketOpen]">[</span>
							<span :class="navCss.barsMid">
								<span :class="[navCss.pipe, navCss.pipe1]">|</span>
								<span :class="[navCss.pipe, navCss.pipe2]">|</span>
								<span :class="[navCss.pipe, navCss.pipe3]">|</span>
							</span>
							<span :class="[navCss.bracket, navCss.bracketClose]">]</span>
						</span>
					</span>
					<span :class="navCss.tag">:nuxt</span>
				</span>
			</span>
			<div :class="navCss.links">
				<FlyvaLink to="/" :class="[navCss.link, route.path === '/' ? navCss.linkActive : '']">Home</FlyvaLink>

				<FlyvaLink to="/about" :class="[navCss.link, route.path === '/about' ? navCss.linkActive : '']">
					About <span :class="navCss.badge">default</span>
				</FlyvaLink>

				<FlyvaLink
					to="/work"
					flyva-transition="slideTransition"
					:class="[navCss.link, route.path.startsWith('/work') ? navCss.linkActive : '']"
				>
					Work <span :class="navCss.badge">slide</span>
				</FlyvaLink>

				<FlyvaLink
					to="/css-demo"
					flyva-transition="cssFadeTransition"
					:class="[navCss.link, route.path === '/css-demo' ? navCss.linkActive : '']"
				>
					CSS Mode <span :class="navCss.badge">css</span>
				</FlyvaLink>

				<FlyvaLink
					to="/overlay"
					flyva-transition="overlayTransition"
					:class="[navCss.link, route.path === '/overlay' ? navCss.linkActive : '']"
				>
					Overlay <span :class="navCss.badge">detached</span>
				</FlyvaLink>

				<FlyvaLink
					to="/lifecycle-demo"
					:class="[navCss.link, route.path === '/lifecycle-demo' ? navCss.linkActive : '']"
				>
					Lifecycle <span :class="navCss.badge">hooks</span>
				</FlyvaLink>

				<FlyvaLink to="/bypass" :flyva="false" :class="[navCss.link, route.path === '/bypass' ? navCss.linkActive : '']">
					Bypass <span :class="navCss.badge">bypass</span>
				</FlyvaLink>
			</div>
		</nav>

		<main class="app-wrapper" data-flyva-content>
			<slot />
		</main>
	</div>
</template>

<style module lang="scss">
@keyframes barsBlink {
	0%,
	100% {
		opacity: 1;
	}
	45% {
		opacity: 0.18;
	}
	55% {
		opacity: 0.18;
	}
}

.root {
	position: fixed;
	top: 0;
	right: 0;
	left: 0;
	height: 62px;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 32px;
	border-bottom: 1px solid var(--border);
	background: rgba(10, 10, 10, 0.85);
	backdrop-filter: blur(12px);
}

.logo {
	display: inline-flex;
	align-items: baseline;
	gap: 0;
	font-weight: 700;
	font-size: 18px;
	letter-spacing: -0.02em;
	color: var(--accent);

	.flyva {
		flex-shrink: 0;
	}

	&.expanded .tail {
		max-width: 14ch;
	}

	&.expanded .bars {
		width: 4.8ch;
		opacity: 1;
	}

	&.expanded .pipe {
		animation: barsBlink 1.05s ease-in-out infinite;
	}

	&.expanded .pipe1 {
		animation-delay: 0s;
	}

	&.expanded .pipe2 {
		animation-delay: 0.14s;
	}

	&.expanded .pipe3 {
		animation-delay: 0.28s;
	}
}

.tail {
	display: inline-flex;
	align-items: center;
	overflow: hidden;
	max-width: 5.5ch;
	transition: max-width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.bars {
	display: inline-block;
	flex: 0 0 auto;
	width: 0;
	min-width: 0;
	overflow: hidden;
	line-height: 1;
	font-size: 0.75em;
	vertical-align: baseline;
	opacity: 0;
	white-space: nowrap;
	text-align: center;
	transition:
		width 0.45s cubic-bezier(0.22, 1, 0.36, 1),
		opacity 0.2s ease;
}

.barsInner {
	display: grid;
	grid-template-columns: auto minmax(min-content, 1fr) auto;
	align-items: center;
	width: max-content;
	letter-spacing: -0.1em;
	padding: 0 0.22em;
	box-sizing: border-box;
}

.bracket {
	opacity: 1;
}

.bracketOpen {
	justify-self: start;
}

.bracketClose {
	justify-self: end;
}

.barsMid {
	display: flex;
	justify-content: center;
	align-items: center;
	min-width: min-content;
}

.pipe {
	display: inline-block;
}

.tag {
	color: var(--muted);
	font-weight: 400;
	font-size: 13px;
	white-space: nowrap;
}

.links {
	display: flex;
	gap: 24px;
}

.link {
	color: var(--muted);
	text-decoration: none;
	font-size: 14px;
	transition: color 0.15s;
	display: inline-flex;
	align-items: center;
	gap: 6px;

	&:hover {
		color: var(--fg);
	}
}

.linkActive {
	color: var(--fg);
}

.badge {
	font-size: 10px;
	padding: 2px 6px;
	border-radius: 4px;
	background: var(--border);
	color: var(--muted);
}
</style>
