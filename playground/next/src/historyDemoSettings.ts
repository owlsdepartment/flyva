import type { FlyvaHistoryStrategy } from '@flyva/next';

export const HISTORY_DEMO_STORAGE_KEY = 'flyva-demo:history';

export type HistoryDemoStrategy = FlyvaHistoryStrategy | 'off';

export interface HistoryDemoSettings {
	strategy: HistoryDemoStrategy;
	transition?: string;
	interceptTimeout?: number;
}

export const HISTORY_DEMO_DEFAULTS: HistoryDemoSettings = { strategy: 'snapshot' };

export function readHistoryDemoSettings(): HistoryDemoSettings {
	if (typeof window === 'undefined') return HISTORY_DEMO_DEFAULTS;
	try {
		const raw = window.sessionStorage.getItem(HISTORY_DEMO_STORAGE_KEY);
		return raw ? { ...HISTORY_DEMO_DEFAULTS, ...JSON.parse(raw) } : HISTORY_DEMO_DEFAULTS;
	} catch {
		return HISTORY_DEMO_DEFAULTS;
	}
}

export function writeHistoryDemoSettings(settings: HistoryDemoSettings) {
	window.sessionStorage.setItem(HISTORY_DEMO_STORAGE_KEY, JSON.stringify(settings));
}
