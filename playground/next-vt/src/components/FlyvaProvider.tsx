'use client';

import { FlyvaRoot } from '@flyva/next';
import { PropsWithChildren } from 'react';

import { fadeTransition, sharedElementTransition, slideVtTransition } from '@/page-transitions';

const transitions = {
	fadeTransition,
	sharedElementTransition,
	slideVtTransition,
};

export function FlyvaProvider({ children }: PropsWithChildren) {
	return (
		<FlyvaRoot
			transitions={transitions}
			config={{ defaultKey: 'fadeTransition', viewTransition: true }}
		>
			{children}
		</FlyvaRoot>
	);
}
