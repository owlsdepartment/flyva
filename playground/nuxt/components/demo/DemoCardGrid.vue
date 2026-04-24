<template>
	<div :class="$style.cardGrid">
		<slot />
	</div>
</template>

<style module lang="scss">
.cardGrid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 16px;
}
</style>
