'use client';

import type { OutgoingHook } from '@flyva/shared';
import { createContext, useContext } from 'react';

export interface FlyvaConfig {
	defaultKey: string;
	viewTransition?: boolean;
	lifecycleClassPrefix?: string;
	/** Global outgoing hooks, run for every concurrent transition (see `PageTransition.prepareOutgoing`). */
	prepareOutgoing?: OutgoingHook | OutgoingHook[];
}

export const FlyvaConfigContext = createContext<FlyvaConfig>(null!);

export function useFlyvaConfig(): FlyvaConfig {
	const ctx = useContext(FlyvaConfigContext);

	if (!ctx) {
		throw new Error('useFlyvaConfig should be used only within FlyvaConfigContext');
	}

	return ctx;
}
