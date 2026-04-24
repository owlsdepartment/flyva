<script setup lang="ts">
defineProps<{
	workDetail?: boolean;
}>();
</script>

<template>
	<div :class="$style.page">
		<div :class="[$style.pageContent, workDetail && $style.workDetail]" data-demo-page-content>
			<slot />
		</div>
	</div>
</template>

<style module lang="scss">
.page {
	min-height: 100dvh;
	background-color: var(--bg);
	padding-top: 62px;
}

.pageContent {
	max-width: 720px;
	margin: 0 auto;
	padding: 64px 32px 96px;
	display: flex;
	flex-direction: column;
	gap: 48px;
}

.workDetail {
	gap: 32px;
}
</style>
