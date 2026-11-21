'use client';

import { useEffect, useState } from 'react';

import {
	HISTORY_DEMO_DEFAULTS,
	type HistoryDemoSettings,
	type HistoryDemoStrategy,
	readHistoryDemoSettings,
	writeHistoryDemoSettings,
} from '@/historyDemoSettings';
import demo from '@/styles/demo-pages.module.scss';

const STRATEGIES: HistoryDemoStrategy[] = ['noop', 'snapshot', 'intercept', 'off'];
const TRANSITIONS = ['', 'historyTransition', 'defaultTransition', 'slideTransition', 'cssFadeTransition'];

export function HistorySwitcher() {
	const [settings, setSettings] = useState<HistoryDemoSettings>(HISTORY_DEMO_DEFAULTS);

	useEffect(() => {
		setSettings(readHistoryDemoSettings());
	}, []);

	const update = (patch: Partial<HistoryDemoSettings>) => {
		const next = { ...settings, ...patch };
		writeHistoryDemoSettings(next);
		setSettings(next);
	};

	return (
		<div className={demo.cardGrid}>
			<fieldset className={demo.card}>
				<legend>Strategy</legend>
				{STRATEGIES.map(strategy => (
					<label key={strategy} style={{ display: 'block' }}>
						<input
							type="radio"
							name="history-strategy"
							value={strategy}
							checked={settings.strategy === strategy}
							onChange={() => update({ strategy })}
						/>{' '}
						{strategy}
					</label>
				))}
			</fieldset>

			<fieldset className={demo.card}>
				<legend>Transition</legend>
				{TRANSITIONS.map(transition => (
					<label key={transition || 'auto'} style={{ display: 'block' }}>
						<input
							type="radio"
							name="history-transition"
							value={transition}
							checked={(settings.transition ?? '') === transition}
							onChange={() => update({ transition: transition || undefined })}
						/>{' '}
						{transition || 'auto (matching → historyTransition)'}
					</label>
				))}
			</fieldset>
		</div>
	);
}
