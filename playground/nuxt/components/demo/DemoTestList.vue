<template>
	<ul :class="$style.testList">
		<slot />
	</ul>
</template>

<style module lang="scss">
.testList {
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 12px;

	li {
		font-size: 13px;
		color: var(--muted);
		padding-left: 16px;
		position: relative;

		&::before {
			content: '→';
			position: absolute;
			left: 0;
			color: var(--accent);
		}
	}

	strong {
		color: var(--fg);
	}
}
</style>
