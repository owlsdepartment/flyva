<template>
	<div :class="$style.row">
		<slot />
	</div>
</template>

<style module lang="scss">
.row {
	display: flex;
	gap: 12px;
	margin-top: 16px;
	flex-wrap: wrap;
}
</style>
