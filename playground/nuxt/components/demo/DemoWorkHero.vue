<template>
	<section :class="$style.hero" data-work-hero>
		<slot />
	</section>
</template>

<style module lang="scss">
.hero {
	background: var(--card-bg);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 48px 40px;

	h1 {
		font-size: 36px;
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 130%;
		margin-bottom: 0.375em;
	}
}
</style>
