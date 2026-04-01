<script setup lang="ts">
import { ref } from 'vue';

const hero = ref<HTMLDivElement | null>(null);
useRefStack('hero', hero);

onScopeDispose(() => {
	console.log('hero:scopeDispose');
});

onUnmounted(() => {
	console.log('hero:onUnmounted');
})
</script>

<template>
	<div ref="hero" class="hero-block">
		<div class="hero-block-inner">
			<h2>refStack demo</h2>
			<p>
				This element is registered via <code>useRefStack('hero', ref)</code>.
				The default transition accesses it with <code>globalGetRefStackItem('hero')</code> and
				scales it down during leave. Navigate away and watch it shrink independently from the content fade.
			</p>
		</div>
	</div>
</template>
