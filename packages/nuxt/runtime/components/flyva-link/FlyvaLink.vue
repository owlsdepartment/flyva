<script lang="ts" setup>
import { NuxtLink } from '#components';
import { navigateTo, useRoute, useRuntimeConfig } from '#app';
import { useFlyvaTransition } from '../../composables';
import type { FlyvaLinkProps } from './types';
import { ref } from 'vue';

const props = withDefaults(defineProps<FlyvaLinkProps>(), {
	prefetch: undefined,
	noPrefetch: undefined,
	custom: undefined,
	external: undefined,
	replace: undefined,
	noRel: undefined,
});

const emit = defineEmits<{
	transitionStart: [];
}>();

const rootEl = ref<InstanceType<typeof NuxtLink>>();
const route = useRoute();
const { prepare } = useFlyvaTransition();

function normalizeHref(href: string): string {
	return href.replace(/\/+$/, '') || '/';
}

async function onClick() {
	if (!import.meta.client) {
		await navigateTo(props.to ?? props.href);
		return;
	}

	const target = (props.to ?? props.href)?.toString() ?? '';
	const currentPath = route.path;

	if (normalizeHref(currentPath) === normalizeHref(target)) return;

	emit('transitionStart');

	const config = useRuntimeConfig().public;
	const options = typeof props.flyvaOptions === 'function' ? props.flyvaOptions() : props.flyvaOptions;

	const el = rootEl.value?.$el as Element | undefined;

	await prepare(
		props.flyvaTransition ?? config.flyva?.defaultKey ?? 'defaultTransition',
		{
			fromHref: currentPath,
			toHref: target,
			...options,
		},
		el,
	);

	await navigateTo(props.to ?? props.href);
}
</script>

<template>
	<NuxtLink v-bind="$props" @click.prevent="onClick" ref="rootEl"><slot /></NuxtLink>
</template>
