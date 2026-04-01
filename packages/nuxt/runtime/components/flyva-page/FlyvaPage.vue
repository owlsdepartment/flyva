<script lang="ts" setup>
import { type TransitionProps } from 'vue';
import { useNuxtApp } from 'nuxt/app';
import { useFlyvaState } from '../../composables';

defineOptions({ inheritAttrs: false });

const { getEnterPromise, getLeavePromise, start, finish } = useFlyvaState();

const nuxtApp = useNuxtApp();
const { $flyvaManager } = nuxtApp;

let resolveLeave: (() => void) | null = null;

nuxtApp.hook('page:loading:start', () => {
	resolveLeave = start();
});

nuxtApp.hook('page:start', async () => {
	if (!$flyvaManager.isRunning) {
		const config = nuxtApp.$config.public.flyva;
		$flyvaManager.run(config?.defaultKey ?? 'defaultTransition', {});
	}

	$flyvaManager.beforeLeave();
	await $flyvaManager.readyPromise;
	await $flyvaManager.leave();
	$flyvaManager.afterLeave();

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

const transition: TransitionProps = {
	css: false,
	mode: 'out-in',

	onLeave: async (_el, done) => {
		await getLeavePromise();
		console.log('onLeave:done')
		done();
	},

	onEnter: async (_el, done) => {
		await getLeavePromise();
		await getEnterPromise();
		done();
	},
};
</script>

<template>
	<NuxtPage v-bind="$attrs" :transition="transition" />
</template>
