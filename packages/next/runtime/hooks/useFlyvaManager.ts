'use client';

import { createContext, useContext } from 'react';

import { PageTransitionManager } from '../../common';

export const FlyvaManagerContext = createContext<PageTransitionManager>(null!);

export function useFlyvaManager(): PageTransitionManager {
	const ctx = useContext(FlyvaManagerContext);

	if (!ctx) {
		throw new Error('useFlyvaManager should be used only within FlyvaManagerContext');
	}

	return ctx;
}
