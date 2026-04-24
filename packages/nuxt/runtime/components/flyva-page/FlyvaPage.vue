<script setup lang="ts">
import { computed, type TransitionProps } from 'vue';
import { useNuxtApp, useRuntimeConfig } from 'nuxt/app';
import { useFlyvaState } from '../../composables';
import { isVtActive, resolveDomSwap } from '../../composables/useFlyvaVtState';
import { applyCssStageClasses } from '../../../../shared/view-transition';

defineOptions({ inheritAttrs: false });

const { getEnterPromise, getLeavePromise, start, finish } = useFlyvaState();

const nuxtApp = useNuxtApp();
const { $flyvaManager } = nuxtApp;
const config = useRuntimeConfig().public;

let resolveLeave: (() => void) | null = null;

const isConcurrent = computed(() => $flyvaManager.runningInstance?.concurrent === true);
const isCssMode = computed(() => $flyvaManager.runningInstance?.cssMode === true);

nuxtApp.hook('page:loading:start', () => {
	resolveLeave = start();
});

nuxtApp.hook('page:start', async () => {
	if (isVtActive()) {
		resolveLeave?.();
		resolveLeave = null;
		return;
	}

	if (isCssMode.value && !config.flyva?.viewTransition) {
		resolveLeave?.();
		resolveLeave = null;
		return;
	}

	if ($flyvaManager.isRunning && !isConcurrent.value) {
		$flyvaManager.beforeLeave();
		await $flyvaManager.readyPromise;
		await $flyvaManager.leave();
		$flyvaManager.afterLeave();
	}

	resolveLeave?.();
	resolveLeave = null;
});

nuxtApp.hook('page:finish', async () => {
	if (isVtActive()) {
		resolveDomSwap();
		finish();
		return;
	}

	await getLeavePromise();

	if (isConcurrent.value) {
		$flyvaManager.beforeEnter();
		await $flyvaManager.readyPromise;
		await $flyvaManager.enter();
		await $flyvaManager.afterEnter();
		finish();
	}
});

const transition = computed<TransitionProps>(() => ({
	css: false,
	mode: isVtActive() ? undefined : (isConcurrent.value ? undefined : 'out-in'),

	onLeave: async (el, done) => {
		if (isVtActive()) {
			done();
			return;
		}

		$flyvaManager.setContentElements(el);

		if (isCssMode.value && !config.flyva?.viewTransition) {
			const name = $flyvaManager.runningName as string;
			if (name) await applyCssStageClasses(el, name, 'leave');
			done();
			return;
		}

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

		if (isCssMode.value && !config.flyva?.viewTransition) {
			const name = $flyvaManager.runningName as string;
			if (name) (el as HTMLElement).classList.add(`${name}-enter-from`);
		}
	},

	onEnter: async (el, done) => {
		if (isVtActive()) {
			done();
			return;
		}

		if (isCssMode.value && !config.flyva?.viewTransition) {
			const name = $flyvaManager.runningName as string;
			if (name) await applyCssStageClasses(el as HTMLElement, name, 'enter');
			$flyvaManager.finishTransition();
			finish();
			done();
			return;
		}

		if (isConcurrent.value) {
			await getEnterPromise();
			done();
			return;
		}

		if (!$flyvaManager.runningInstance) {
			finish();
			done();
			return;
		}

		$flyvaManager.beforeEnter(el);
		await $flyvaManager.readyPromise;
		await $flyvaManager.enter(el);
		await $flyvaManager.afterEnter(el);
		finish();
		done();
	},
}));
</script>

<template>
	<NuxtPage v-bind="$attrs" :transition="transition" />
</template>
