<script setup lang="ts">
import { NuxtLink } from '#components';
import { navigateTo, useNuxtApp, useRoute, useRuntimeConfig } from '#app';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useFlyvaTransition } from '../../composables';
import { useFlyvaLifecycle } from '../../composables/useFlyvaLifecycle';
import { createDomSwapPromise, setVtActive } from '../../composables/useFlyvaVtState';
import {
	applyViewTransitionNames,
	clearViewTransitionNames,
	supportsViewTransitions,
} from '../../../../shared/view-transition';
import type { FlyvaLinkProps } from './types';

const props = withDefaults(defineProps<FlyvaLinkProps>(), {
	flyva: true,
	prefetch: undefined,
	noPrefetch: undefined,
	custom: undefined,
	external: undefined,
	replace: undefined,
	noRel: undefined,
});

// useFlyvaLifecycle({
// 	beforeLeave: ctx => props.onBeforeLeave?.(ctx),
// 	leave: ctx => props.onLeave?.(ctx),
// 	afterLeave: ctx => props.onAfterLeave?.(ctx),
// 	beforeEnter: ctx => props.onBeforeEnter?.(ctx),
// 	enter: ctx => props.onEnter?.(ctx),
// 	afterEnter: ctx => props.onAfterEnter?.(ctx),
// });

const nuxtLinkBind = computed(() => {
	if (props.flyva === false) {
		const { flyva: _flyva, ...rest } = props;
		return rest;
	}
	const {
		flyva: _f,
		flyvaTransition: _ft,
		flyvaOptions: _fo,
		onTransitionStart: _ts,
		onPrepare: _op,
		onBeforeLeave: _obl,
		onLeave: _ol,
		onAfterLeave: _oal,
		onBeforeEnter: _obe,
		onEnter: _oe,
		onAfterEnter: _oae,
		onCleanup: _oc,
		...rest
	} = props;
	return rest;
});

const emit = defineEmits<{
	transitionStart: [];
}>();

const rootEl = ref<InstanceType<typeof NuxtLink>>();
const route = useRoute();
const router = useRouter();
const { $flyvaManager } = useNuxtApp();
const { prepare } = useFlyvaTransition();

function resolveFlyvaPath(to: unknown, href: unknown): string {
	const raw = to ?? href;
	if (raw == null || raw === '') return '/';
	if (typeof raw === 'string') {
		if (/^https?:\/\//i.test(raw)) {
			try {
				return new URL(raw).pathname;
			} catch {
				return '/';
			}
		}
		return raw.split('?')[0]?.split('#')[0] ?? '/';
	}
	return router.resolve(raw).path;
}

function normalizeHref(href: string): string {
	return href.replace(/\/+$/, '') || '/';
}

async function onClick() {
	if (props.flyva === false) {
		return;
	}

	if (!import.meta.client) {
		await navigateTo(props.to ?? props.href);
		return;
	}

	const targetPath = resolveFlyvaPath(props.to, props.href);
	const currentPath = route.path;

	if (normalizeHref(currentPath) === normalizeHref(targetPath)) return;

	emit('transitionStart');
	props.onTransitionStart?.();

	const options = typeof props.flyvaOptions === 'function' ? props.flyvaOptions() : props.flyvaOptions;

	const el = rootEl.value?.$el as Element | undefined;

	await prepare(
		props.flyvaTransition,
		{
			fromHref: currentPath,
			toHref: targetPath,
			...options,
		},
		el,
	);

	const transition = $flyvaManager.runningInstance;
	const config = useRuntimeConfig().public;
	const vtEnabled = config.flyva?.viewTransition && supportsViewTransitions();

	if (vtEnabled && transition) {
		setVtActive(true);
		const context = $flyvaManager.makeContext(el);

		let resolvedNames: Record<string, string> | undefined;
		if (transition.viewTransitionNames) {
			resolvedNames = applyViewTransitionNames(transition.viewTransitionNames, context, transition);
		}

		const domSwap = createDomSwapPromise();

		const vt = document.startViewTransition(async () => {
			await navigateTo(props.to ?? props.href);
			await domSwap;
			if (resolvedNames) {
				applyViewTransitionNames(resolvedNames, context, transition);
			}
		});

		context.viewTransition = vt;

		if (transition.animateViewTransition) {
			await vt.ready;
			await Promise.resolve(transition.animateViewTransition.call(transition, vt, context));
		}

		await vt.finished;

		if (resolvedNames) clearViewTransitionNames(resolvedNames);
		transition.cleanup?.call(transition, context);
		$flyvaManager.finishTransition();
		setVtActive(false);
	} else {
		await navigateTo(props.to ?? props.href);
	}
}
</script>

<template>
	<NuxtLink v-if="!flyva" v-bind="nuxtLinkBind"><slot /></NuxtLink>
	<NuxtLink v-else v-bind="nuxtLinkBind" ref="rootEl" @click.prevent="onClick"><slot /></NuxtLink>
</template>
