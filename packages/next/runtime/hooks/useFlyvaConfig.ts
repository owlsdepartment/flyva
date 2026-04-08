'use client';

import { createContext, useContext } from 'react';

export interface FlyvaConfig {
	defaultKey: string;
	viewTransition?: boolean;
}

export const FlyvaConfigContext = createContext<FlyvaConfig>(null!);

export function useFlyvaConfig(): FlyvaConfig {
	const ctx = useContext(FlyvaConfigContext);

	if (!ctx) {
		throw new Error('useFlyvaConfig should be used only within FlyvaConfigContext');
	}

	return ctx;
}
