<script lang="ts" setup>
import { computed, type TransitionProps } from 'vue';
import { useNuxtApp } from 'nuxt/app';
import { useFlyvaState } from '../../composables';

defineOptions({ inheritAttrs: false });

const { getEnterPromise, getLeavePromise, start, finish } = useFlyvaState();

const nuxtApp = useNuxtApp();
const { $flyvaManager } = nuxtApp;

let resolveLeave: (() => void) | null = null;

const isConcurrent = computed(() => $flyvaManager.runningInstance?.concurrent === true);

nuxtApp.hook('page:loading:start', () => {
	resolveLeave = start();
});

nuxtApp.hook('page:start', async () => {
	if (!$flyvaManager.isRunning) {
		const config = nuxtApp.$config.public.flyva;
		$flyvaManager.run(config?.defaultKey ?? 'defaultTransition', {});
	}

	if (!isConcurrent.value) {
		$flyvaManager.beforeLeave();
		await $flyvaManager.readyPromise;
		await $flyvaManager.leave();
		$flyvaManager.afterLeave();
	}

	resolveLeave?.();
	resolveLeave = null;
});

nuxtApp.hook('page:finish', async () => {
	await getLeavePromise();

	$flyvaManager.beforeEnter();
	await $flyvaManager.readyPromise;
	await $flyvaManager.enter();
	$flyvaManager.afterEnter();

	finish();
});

const transition = computed<TransitionProps>(() => ({
	css: false,
	mode: isConcurrent.value ? undefined : 'out-in',

	onLeave: async (el, done) => {
		$flyvaManager.setContentElements(el);

		if (isConcurrent.value) {
			$flyvaManager.beforeLeave();
			await $flyvaManager.leave();
			$flyvaManager.afterLeave();
			await getEnterPromise();
		} else {
			await getLeavePromise();
		}

		done();
	},

	onBeforeEnter: (el) => {
		$flyvaManager.setContentElements($flyvaManager.currentContent, el);
	},

	onEnter: async (_el, done) => {
		await getLeavePromise();
		await getEnterPromise();
		done();
	},
}));
</script>

<template>
	<NuxtPage v-bind="$attrs" :transition="transition" />
</template>
