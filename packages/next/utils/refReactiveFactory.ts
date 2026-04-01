'use client';

import type { Reactive, ReactiveFactory } from '@flyva/shared';

import { useRefState } from '../runtime/composables/useRefState';

export const refReactiveFactory: ReactiveFactory = <T>(initialValue: T) =>
	// eslint-disable-next-line react-hooks/rules-of-hooks
	useRefState<T>(initialValue) as Reactive<NonNullable<T>>;
