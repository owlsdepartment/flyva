<template>
	<div :class="$style.card">
		<slot />
	</div>
</template>

<style module lang="scss">
.card {
	background: var(--card-bg);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 24px;

	h3 {
		font-size: 14px;
		font-weight: 600;
		margin-bottom: 6px;
	}

	p {
		font-size: 12px;
		color: var(--muted);
	}
}
</style>
