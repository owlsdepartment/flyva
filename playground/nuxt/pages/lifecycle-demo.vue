<script setup lang="ts">
import { ref } from 'vue';
import { animate } from 'animejs';
import { useFlyvaStickyRef } from '@flyva/nuxt/composables';

const barRef = useFlyvaStickyRef<HTMLDivElement>();
const log = ref<string[]>([]);

useFlyvaLifecycle({
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
});

const teleportActive = ref(false);

onMounted(() => teleportActive.value = true)

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
			await new Promise(resolve => setTimeout(resolve, 500));
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
			teleportActive.value = false;
		},
	},
	{ active: true },
);

const indicator = ref(false);
</script>

<template>
	<div class="page">
		<div class="page-content">
			<section class="section">
				<h1>Lifecycle hooks</h1>
				<p>
					This page demonstrates <code>useFlyvaLifecycle</code> in both passive
					and active modes, plus <code>FlyvaLink</code> callback props.
				</p>
			</section>

			<section class="section">
				<h2>Passive mode log</h2>
				<p>Events logged by <code>useFlyvaLifecycle</code> (passive, fire-and-forget).</p>
				<div class="lifecycle-log">
					<div v-if="log.length === 0" class="lifecycle-log-entry">Navigate to see events...</div>
					<div v-for="(entry, i) in log" :key="i" class="lifecycle-log-entry">
						<span>{{ entry.split(' → ')[0] }}</span> → {{ entry.split(' → ')[1] }}
					</div>
				</div>
			</section>

			<section class="section">
				<h2>Active mode progress bar</h2>
				<p>
					A progress bar animated via <code>useFlyvaLifecycle</code> in active mode.
					The transition awaits this animation before proceeding. It sits above the
					<code>lifecycleLinkOverlayTransition</code> black overlay (<code>z-index</code>).
				</p>
				<div class="lifecycle-progress-float">
					<div class="lifecycle-progress">
						<div ref="barRef" class="lifecycle-progress-bar" />
					</div>
				</div>
			</section>

			<section class="section">
				<h2>FlyvaLink callback props</h2>
				<p>
					Indicator turns on at <code>onBeforeLeave</code> and off at
					<code>onAfterEnter</code>. The link uses a dedicated black overlay transition
					instead of the default content fade.
					<span :class="['lifecycle-indicator', { 'lifecycle-indicator--active': indicator }]" />
				</p>
				<FlyvaLink
					to="/about"
					flyva-transition="lifecycleLinkOverlayTransition"
					:on-before-leave="() => (indicator = true)"
					:on-after-enter="() => (indicator = false)"
				>
					Go to About (with indicator)
				</FlyvaLink>
			</section>

			<section class="section">
				<h2>Lifecycle classes on &lt;html&gt;</h2>
				<p>
					<code>flyva-running</code> stays on for the whole swap. Phase tokens
					<code>flyva-leave-*</code> / <code>flyva-enter-*</code> follow Vue-style steps;
					<code>flyva-pending</code> covers the gap after leave and before enter so the
					nav border animation stays continuous.
					<code>data-flyva-transition</code> on <code>&lt;html&gt;</code> is the transition key
					— the playground hides the nav shimmer for <code>overlayTransition</code>.
					<code>flyva-transition-active</code> on <code>&lt;body&gt;</code> is the overlay from
					playground transitions, not the same as <code>flyva-running</code> on <code>&lt;html&gt;</code>.
				</p>
			</section>
		</div>
	</div>
</template>
