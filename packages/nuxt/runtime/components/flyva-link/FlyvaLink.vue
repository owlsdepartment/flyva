<script lang="ts" setup>
import { NuxtLink } from '#components';
import { navigateTo, useNuxtApp, useRoute, useRuntimeConfig } from '#app';
import { useFlyvaTransition } from '../../composables';
import { createDomSwapPromise, setVtActive } from '../../composables/useFlyvaVtState';
import {
	applyViewTransitionNames,
	clearViewTransitionNames,
	supportsViewTransitions,
} from '../../../../shared/view-transition';
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
const { $flyvaManager } = useNuxtApp();
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

	const transition = $flyvaManager.runningInstance;
	const vtEnabled = config.flyva?.viewTransition && supportsViewTransitions();

	if (vtEnabled && transition) {
		setVtActive(true);
		const context = $flyvaManager.makeContext(el);

		let resolvedNames: Record<string, string> | undefined;
		if (transition.viewTransitionNames) {
			resolvedNames = applyViewTransitionNames(transition.viewTransitionNames, context);
		}

		const domSwap = createDomSwapPromise();

		const vt = document.startViewTransition(async () => {
			await navigateTo(props.to ?? props.href);
			await domSwap;
			if (resolvedNames) {
				applyViewTransitionNames(resolvedNames, context);
			}
		});

		context.viewTransition = vt;

		if (transition.animateViewTransition) {
			await vt.ready;
			await transition.animateViewTransition(vt, context);
		}

		await vt.finished;

		if (resolvedNames) clearViewTransitionNames(resolvedNames);
		transition.cleanup?.();
		$flyvaManager.finishTransition();
		setVtActive(false);
	} else {
		await navigateTo(props.to ?? props.href);
	}
}
</script>

<template>
	<NuxtLink v-bind="$props" @click.prevent="onClick" ref="rootEl"><slot /></NuxtLink>
</template>
