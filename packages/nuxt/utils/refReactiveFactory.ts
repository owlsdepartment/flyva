import { ref } from 'vue';

import type { Reactive, ReactiveFactory } from '../../shared/types';

export const refReactiveFactory: ReactiveFactory = <T>(initialValue: T) =>
	ref(initialValue) as Reactive<NonNullable<T>>;
