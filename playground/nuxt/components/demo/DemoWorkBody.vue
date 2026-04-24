<template>
	<p :class="$style.body">
		<slot />
	</p>
</template>

<style module lang="scss">
.body {
	font-size: 15px;
	line-height: 180%;
	color: var(--muted);
}
</style>
