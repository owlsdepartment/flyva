<script setup lang="ts">
defineProps<{
	to: string;
	transition: string;
}>();
</script>

<template>
	<FlyvaLink :to="to" :flyva-transition="transition" :class="$style.btn">
		<slot />
	</FlyvaLink>
</template>

<style module lang="scss">
.btn {
	display: inline-block;
	padding: 10px 20px;
	background: var(--card-bg);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	color: var(--fg);
	text-decoration: none;
	font-size: 13px;
	transition: border-color 0.2s, background 0.2s;
	cursor: pointer;

	&:hover {
		border-color: var(--accent);
		background: rgba(110, 231, 183, 0.06);
	}
}
</style>
