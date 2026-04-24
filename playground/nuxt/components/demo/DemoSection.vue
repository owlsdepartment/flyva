<template>
	<section :class="$style.section">
		<slot />
	</section>
</template>

<style module lang="scss">
.section {
	h1 {
		font-size: 32px;
		font-weight: 700;
		letter-spacing: -0.03em;
		margin-bottom: 12px;
	}

	h2 {
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0.02em;
		margin-bottom: 12px;
	}

	p {
		color: var(--muted);
		font-size: 14px;
	}

	code {
		background: var(--card-bg);
		border: 1px solid var(--border);
		padding: 1px 5px;
		border-radius: 4px;
		font-size: 12px;
		color: var(--accent);
	}
}
</style>
