'use client';

import { FlyvaRoot } from '@flyva/next';
import { PropsWithChildren } from 'react';

import { readHistoryDemoSettings } from '@/historyDemoSettings';
import {
	cssFadeTransition,
	cssSlideTransition,
	defaultTransition,
	expandTransition,
	historyTransition,
	overlayTransition,
	slideTransition,
} from '@/page-transitions';

const transitions = {
	cssFadeTransition,
	cssSlideTransition,
	defaultTransition,
	expandTransition,
	historyTransition,
	overlayTransition,
	slideTransition,
};

type TransitionKey = keyof typeof transitions;

export function FlyvaProvider({ children }: PropsWithChildren) {
	return (
		<FlyvaRoot
			transitions={transitions}
			config={{
				history: {
					strategy: () => {
						const { strategy } = readHistoryDemoSettings();
						return strategy === 'off' ? false : strategy;
					},
					defaultKey: 'historyTransition',
					transition: () => {
						const { transition } = readHistoryDemoSettings();
						return transition && transition in transitions ? (transition as TransitionKey) : undefined;
					},
					get interceptTimeout() {
						return readHistoryDemoSettings().interceptTimeout;
					},
				},
			}}
		>
			{children}
		</FlyvaRoot>
	);
}
