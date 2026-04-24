<script setup lang="ts">
import { ref } from 'vue';

const hero = ref<HTMLDivElement | null>(null);
useRefStack('hero', hero);
</script>

<template>
	<div ref="hero" :class="$style.root">
		<div :class="$style.inner">
			<h2>refStack demo</h2>
			<p>
				This element is registered via <code>useRefStack('hero', ref)</code>. The default transition accesses it with
				<code>globalGetRefStackItem('hero')</code> and scales it down during leave. Navigate away and watch it shrink
				independently from the content fade.
			</p>
		</div>
	</div>
</template>

<style module lang="scss">
.root {
	border: 1px solid var(--accent);
	border-radius: var(--radius);
	padding: 2px;
	transform-origin: center;
}

.inner {
	background: linear-gradient(135deg, rgba(110, 231, 183, 0.08), transparent);
	border-radius: calc(var(--radius) - 2px);
	padding: 32px;
}

.root h2 {
	color: var(--accent);
	font-size: 16px;
	margin-bottom: 8px;
}

.root p {
	color: var(--muted);
	font-size: 13px;
	line-height: 170%;
}

.root code {
	background: var(--card-bg);
	border: 1px solid var(--border);
	padding: 1px 5px;
	border-radius: 4px;
	font-size: 11px;
	color: var(--accent);
}
</style>
