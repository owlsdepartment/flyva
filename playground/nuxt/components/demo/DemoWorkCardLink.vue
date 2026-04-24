<script setup lang="ts">
defineProps<{
	to: string;
	cardId: string;
}>();
</script>

<template>
	<FlyvaLink :to="to" flyva-transition="expandTransition" :class="$style.workCard" :data-work-card="cardId">
		<slot />
	</FlyvaLink>
</template>

<style module lang="scss">
.workCard {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	text-decoration: none;
	color: inherit;
	background: var(--card-bg);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 24px;
	cursor: pointer;
	transition: border-color 0.2s, background 0.2s;

	&:hover {
		border-color: var(--accent);
		background: rgba(110, 231, 183, 0.06);
	}

	h3 {
		font-size: 16px;
		font-weight: 700;
		line-height: 130%;
		letter-spacing: -0.03em;
		margin: 0;
		padding-bottom: 0.375em;
		color: var(--fg);
	}

	p {
		font-size: 13px;
		color: var(--muted);
		line-height: 160%;
		margin: 0;
	}
}
</style>
