<template>
	<FlyvaLink
		to="/work"
		:flyva-options="{ direction: 'left' }"
		:class="$style.backLink"
	>
		<slot />
	</FlyvaLink>
</template>

<style module lang="scss">
.backLink {
	display: inline-block;
	color: var(--accent);
	text-decoration: none;
	font-size: 14px;
	transition: opacity 0.15s;

	&:hover {
		opacity: 0.7;
	}
}
</style>
