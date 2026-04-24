<template>
	<p :class="$style.intro">
		<slot />
	</p>
</template>

<style module lang="scss">
.intro {
	color: var(--accent);
	font-size: 16px;
	line-height: 160%;
}
</style>
