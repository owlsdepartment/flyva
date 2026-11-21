'use client';

import { supportsViewTransitions } from '@flyva/shared';
import { PropsWithChildren } from 'react';

import { refReactiveFactory } from '../../../utils/refReactiveFactory';
import { FlyvaHistory } from '../../history/FlyvaHistory';
import { FlyvaConfig, FlyvaConfigContext } from '../../hooks';
import { FlyvaManagerContext } from '../../hooks/useFlyvaManager';
import type { RefState } from '../../hooks/useRefState';
import { PageTransition, PageTransitionManager } from '../../page-transition-manager';
import { FlyvaScroll } from '../../scroll/FlyvaScroll';

let singleton: PageTransitionManager | null = null;
let _vtWarned = false;
let _historyKeyWarned = false;

export function FlyvaRoot<
	T extends Record<string, PageTransition> = Record<string, PageTransition>,
>({
	children,
	transitions,
	config,
}: PropsWithChildren<{ transitions: T; config?: Partial<FlyvaConfig<Extract<keyof T, string>>> }>) {
	const manager =
		singleton ??
		(new PageTransitionManager<T, RefState<unknown>>(transitions ?? {}, refReactiveFactory, {
			viewTransition: config?.viewTransition,
			lifecycleClassPrefix: config?.lifecycleClassPrefix,
			defaultTransitionKey: config?.defaultKey ?? 'defaultTransition',
			prepareOutgoing: config?.prepareOutgoing,
		}) as any);
	singleton = manager;

	const configWithDefaults: FlyvaConfig = {
		...config,
		defaultKey: config?.defaultKey ?? 'defaultTransition',
	};

	if (process.env.NODE_ENV === 'development' && configWithDefaults.viewTransition && !_vtWarned) {
		_vtWarned = true;
		if (typeof document !== 'undefined' && !supportsViewTransitions()) {
			console.warn(
				'[flyva] viewTransition is enabled but this browser does not support the View Transitions API',
			);
		}
	}

	const historyDefaultKey = config?.history?.defaultKey;
	if (
		process.env.NODE_ENV === 'development' &&
		historyDefaultKey !== undefined &&
		!(historyDefaultKey in (transitions ?? {})) &&
		!_historyKeyWarned
	) {
		_historyKeyWarned = true;
		console.warn(`[flyva] history.defaultKey "${historyDefaultKey}" not in transitions map`);
	}

	return (
		<div className="flyva-root">
			<FlyvaConfigContext.Provider value={configWithDefaults}>
				<FlyvaManagerContext.Provider value={manager}>
					{config?.scroll && <FlyvaScroll />}
					{config?.history && <FlyvaHistory />}
					{children}
				</FlyvaManagerContext.Provider>
			</FlyvaConfigContext.Provider>
		</div>
	);
}
