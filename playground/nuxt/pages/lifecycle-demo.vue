<script setup lang="ts">
import { animate } from 'animejs';
import { useFlyvaStickyRef } from '@flyva/nuxt/composables';

import DemoPage from '~/components/demo/DemoPage.vue';
import DemoSection from '~/components/demo/DemoSection.vue';

const css = useCssModule();

const barRef = useFlyvaStickyRef<HTMLDivElement>();
const log = ref<string[]>([]);

useFlyvaLifecycle({
	prepare(ctx) {
		log.value = [...log.value, `prepare → ${ctx.name}`];
	},
	beforeLeave(ctx) {
		log.value = [...log.value, `beforeLeave → ${ctx.name}`];
	},
	leave(ctx) {
		log.value = [...log.value, `leave → ${ctx.name}`];
	},
	afterLeave(ctx) {
		log.value = [...log.value, `afterLeave → ${ctx.name}`];
	},
	beforeEnter(ctx) {
		log.value = [...log.value, `beforeEnter → ${ctx.name}`];
	},
	enter(ctx) {
		log.value = [...log.value, `enter → ${ctx.name}`];
	},
	afterEnter(ctx) {
		log.value = [...log.value, `afterEnter → ${ctx.name}`];
	},
	cleanup() {
		log.value = [...log.value, 'cleanup → —'];
	},
});

useFlyvaLifecycle(
	{
		async leave() {
			const el = barRef.value;
			if (!el) return;
			el.style.width = '0%';
			await animate(el, {
				width: '60%',
				duration: 400,
				ease: 'outQuad',
			});
			await new Promise((resolve) => setTimeout(resolve, 500));
			await animate(el, {
				width: '100%',
				duration: 300,
				ease: 'outQuad',
			});
			await animate(el, {
				opacity: 0,
				duration: 400,
				ease: 'outQuad',
			});
		},
	},
	{ blocking: true },
);

const indicator = ref(false);
</script>

<template>
	<DemoPage>
		<DemoSection>
			<h1>Lifecycle hooks</h1>
			<p>
				This page demonstrates <code>useFlyvaLifecycle</code> in non-blocking (default) and blocking (
				<code>blocking: true</code>) modes, plus <code>FlyvaLink</code> callback props.
			</p>
		</DemoSection>

		<DemoSection>
			<h2>Passive mode log</h2>
			<p>Events logged by <code>useFlyvaLifecycle</code> (non-blocking, fire-and-forget).</p>
			<div :class="css.log">
				<div v-if="log.length === 0" :class="css.logEntry">Navigate to see events...</div>
				<div v-for="(entry, i) in log" :key="i" :class="css.logEntry">
					<span>{{ entry.split(' → ')[0] }}</span> → {{ entry.split(' → ')[1] }}
				</div>
			</div>
		</DemoSection>

		<DemoSection>
			<h2>Blocking lifecycle (<code>blocking: true</code>) progress bar</h2>
			<p>
				A progress bar animated via <code>useFlyvaLifecycle</code> with <code>blocking: true</code>. The transition awaits this
				animation before proceeding. It sits above the <code>lifecycleLinkOverlayTransition</code> black overlay (
				<code>z-index</code>).
			</p>
			<div :class="css.progressFloat">
				<div :class="css.progress">
					<div ref="barRef" :class="css.progressBar" />
				</div>
			</div>
		</DemoSection>

		<DemoSection>
			<h2>FlyvaLink callback props</h2>
			<p>
				Indicator turns on at <code>onBeforeLeave</code> and off at <code>onAfterEnter</code>. The link uses a dedicated black overlay
				transition instead of the default content fade.
				<span :class="[css.indicator, indicator ? css.active : '']" />
			</p>
			<FlyvaLink
				to="/about"
				flyva-transition="lifecycleLinkOverlayTransition"
				:on-before-leave="() => (indicator = true)"
				:on-after-enter="() => (indicator = false)"
			>
				Go to About (with indicator)
			</FlyvaLink>
		</DemoSection>

		<DemoSection>
			<h2>Lifecycle classes on &lt;html&gt;</h2>
			<p>
				<code>flyva-running</code> stays on for the whole swap. Phase tokens <code>flyva-leave-*</code> /
				<code>flyva-enter-*</code> follow Vue-style steps; <code>flyva-pending</code> covers the gap after leave and before enter so
				the nav border animation stays continuous. 				<code>data-flyva-transition</code> on <code>&lt;html&gt;</code> is the transition key
				— the playground hides the nav shimmer for <code>overlayTransition</code>.
				The demo wait overlay uses <code>html.flyva-running::after</code> in global CSS, aligned with <code>flyva-running</code> on <code>&lt;html&gt;</code>.
			</p>
		</DemoSection>
	</DemoPage>
</template>

<style module lang="scss">
.log {
	background: var(--card-bg);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 16px;
	max-height: 280px;
	overflow-y: auto;
	font-size: 12px;
	line-height: 180%;
}

.logEntry {
	color: var(--muted);

	span {
		color: var(--accent);
		font-weight: 600;
	}
}

.indicator {
	display: inline-block;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: var(--border);
	transition: background 0.2s;
	vertical-align: middle;
	margin-left: 6px;

	&.active {
		background: var(--accent);
	}
}

.progressFloat {
	position: fixed;
	bottom: 10vh;
	left: 50%;
	transform: translateX(-50%);
	z-index: 120;
	padding: 2rem;
	border-radius: var(--radius);
	background: rgba(0, 0, 0, 0.55);
	backdrop-filter: blur(14px);
	-webkit-backdrop-filter: blur(14px);
	box-sizing: border-box;
}

.progressFloat .progress {
	width: min(22rem, calc(100vw - 6rem));
	margin-top: 0;
	height: 3px;
	background: var(--border);
	border-radius: 2px;
	overflow: hidden;
}

.progressBar {
	height: 100%;
	width: 0%;
	background: var(--accent);
	border-radius: 2px;
}
</style>
