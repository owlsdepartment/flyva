'use client';

import { useEffect, useRef } from 'react';

import { useFlyvaConfig } from '../hooks/useFlyvaConfig';
import { useFlyvaManager } from '../hooks/useFlyvaManager';
import { installScrollController } from './scrollController';

/**
 * Handles scroll restoration for `FlyvaRoot` when `config.scroll` is set. Rendered by
 * `FlyvaRoot`; not part of the public API.
 */
export function FlyvaScroll() {
	const manager = useFlyvaManager();
	const config = useFlyvaConfig();

	const live = useRef({ manager, config });
	useEffect(() => {
		live.current = { manager, config };
	});

	useEffect(
		() =>
			installScrollController({
				manager: () => live.current.manager,
				config: () => live.current.config.scroll,
			}),
		[],
	);

	return null;
}
