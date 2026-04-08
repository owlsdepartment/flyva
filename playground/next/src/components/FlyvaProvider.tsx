'use client';

import { FlyvaRoot } from '@flyva/next';
import { PropsWithChildren } from 'react';

import { cssFadeTransition, cssSlideTransition, defaultTransition, expandTransition, overlayTransition, slideTransition } from '@/page-transitions';

const transitions = {
	cssFadeTransition,
	cssSlideTransition,
	defaultTransition,
	expandTransition,
	overlayTransition,
	slideTransition,
};

export function FlyvaProvider({ children }: PropsWithChildren) {
	return <FlyvaRoot transitions={transitions}>{children}</FlyvaRoot>;
}
