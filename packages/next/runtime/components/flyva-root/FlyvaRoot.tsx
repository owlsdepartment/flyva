'use client';

import { PropsWithChildren } from 'react';

import { refReactiveFactory } from '../../../utils/refReactiveFactory';
import { FlyvaConfig, FlyvaConfigContext } from '../../composables';
import { FlyvaManagerContext } from '../../composables/useFlyvaManager';
import type { RefState } from '../../composables/useRefState';
import { PageTransition, PageTransitionManager } from '../../page-transition-manager';
import { FlyvaTransitionWrapper } from '../flyva-transition-wrapper';

let singleton: PageTransitionManager | null = null;

export function FlyvaRoot<T extends Record<string, PageTransition> = Record<string, PageTransition>>({
	children, transitions, config,
}: PropsWithChildren<{ transitions: T; config?: Partial<FlyvaConfig> }>) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const manager = singleton ?? new PageTransitionManager<T, RefState<unknown>>(transitions ?? {}, refReactiveFactory) as any;
	singleton = manager;

	const configWithDefaults: FlyvaConfig = {
		...config,
		defaultKey: config?.defaultKey ?? 'defaultTransition',
	};

	return (
		<div className="flyva-root">
			<FlyvaConfigContext.Provider value={configWithDefaults}>
				<FlyvaManagerContext.Provider value={manager}>
					<FlyvaTransitionWrapper>
						{children}
					</FlyvaTransitionWrapper>
				</FlyvaManagerContext.Provider>
			</FlyvaConfigContext.Provider>
		</div>
	);
}
