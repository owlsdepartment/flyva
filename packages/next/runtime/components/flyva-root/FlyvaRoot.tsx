'use client';

import { PropsWithChildren } from 'react';

import { supportsViewTransitions } from '@flyva/shared';

import { refReactiveFactory } from '../../../utils/refReactiveFactory';
import { FlyvaConfig, FlyvaConfigContext } from '../../hooks';
import { FlyvaManagerContext } from '../../hooks/useFlyvaManager';
import type { RefState } from '../../hooks/useRefState';
import { PageTransition, PageTransitionManager } from '../../page-transition-manager';

let singleton: PageTransitionManager | null = null;
let _vtWarned = false;

export function FlyvaRoot<T extends Record<string, PageTransition> = Record<string, PageTransition>>({
	children, transitions, config,
}: PropsWithChildren<{ transitions: T; config?: Partial<FlyvaConfig> }>) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const manager = singleton ?? new PageTransitionManager<T, RefState<unknown>>(transitions ?? {}, refReactiveFactory, { viewTransition: config?.viewTransition, lifecycleClassPrefix: config?.lifecycleClassPrefix }) as any;
	singleton = manager;

	const configWithDefaults: FlyvaConfig = {
		...config,
		defaultKey: config?.defaultKey ?? 'defaultTransition',
	};

	if (process.env.NODE_ENV === 'development' && configWithDefaults.viewTransition && !_vtWarned) {
		_vtWarned = true;
		if (typeof document !== 'undefined' && !supportsViewTransitions()) {
			console.warn('[flyva] viewTransition is enabled but this browser does not support the View Transitions API');
		}
	}

	return (
		<div className="flyva-root">
			<FlyvaConfigContext.Provider value={configWithDefaults}>
				<FlyvaManagerContext.Provider value={manager}>
					{children}
				</FlyvaManagerContext.Provider>
			</FlyvaConfigContext.Provider>
		</div>
	);
}
