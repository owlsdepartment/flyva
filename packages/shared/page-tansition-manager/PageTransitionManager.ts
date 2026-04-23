import type { Reactive, ReactiveFactory } from '../types';
import { applyLifecycleClasses } from '../lifecycle-classes';
import type {
	ActiveHookRegistration,
	PageTransition,
	PageTransitionContext,
	PageTransitionOptions,
	PageTransitionStage,
	PageTransitionTrigger,
	RegisterActiveHookReturn,
} from './types';

export interface PageTransitionManagerConfig {
	viewTransition?: boolean;
	lifecycleClassPrefix?: string;
}

export class PageTransitionManager<
	T extends Record<string, PageTransition> = Record<string, PageTransition>,
	R extends Reactive<unknown> = Reactive<unknown>
> {
	protected _isRunning: Reactive<boolean>;
	protected _runningInstance: Reactive<PageTransition | undefined>;
	protected _runningName: Reactive<keyof T | undefined>;
	protected _readyPromise?: Promise<void>;
	protected _currentOptions?: T[keyof T] extends PageTransition<infer O>
		? O
		: PageTransitionOptions;
	protected _trigger: PageTransitionTrigger = 'internal';
	protected _stage: Reactive<PageTransitionStage>;
	protected _currentContent?: Element;
	protected _nextContent?: Element;
	protected _warnedTransitions = new Set<string>();
	protected _config: PageTransitionManagerConfig;
	protected _activeHooks = new Set<ActiveHookRegistration>();
	protected _gcHooks = new Set<() => void>();

	constructor(
		protected transitions: T,
		protected reactiveFactory: ReactiveFactory<unknown, R>,
		config?: PageTransitionManagerConfig,
	) {
		this._isRunning = this.reactiveFactory(false);
		this._runningInstance = this.reactiveFactory();
		this._runningName = this.reactiveFactory();
		this._stage = this.reactiveFactory('none');
		this._config = config ?? {};
	}

	get lifecycleClassPrefix() {
		return this._config.lifecycleClassPrefix ?? 'flyva';
	}

	get isRunning() {
		return this._isRunning.value;
	}

	get runningInstance() {
		return this._runningInstance.value;
	}

	get runningName() {
		return this._runningName.value;
	}

	get stage() {
		return this._stage.value;
	}

	get readyPromise() {
		return this._readyPromise ?? Promise.resolve();
	}

	get currentContent() {
		return this._currentContent;
	}

	get nextContent() {
		return this._nextContent;
	}

	run<K extends keyof T>(
		name: K,
		options: T[K] extends PageTransition<infer O> ? O : PageTransitionOptions,
		trigger?: PageTransitionTrigger
	) {
		if (this.runningInstance) {
			this.runningInstance.cleanup?.();
		}

		const current = this.transitions[name];
		this._runningInstance.value = current;
		this._runningName.value = name;
		this._currentOptions = options;
		this._isRunning.value = true;
		this._trigger = trigger ?? 'internal';

		if (current) this._validateTransition(name as string, current);

		const el = trigger instanceof Element ? trigger : undefined;

		this._readyPromise = current?.prepare?.(this.makeContext(el)) ?? Promise.resolve();

		return this._readyPromise;
	}

	protected _lifecycleTransitionKey(): string | undefined {
		const n = this._runningName.value;
		return n === undefined ? undefined : String(n);
	}

	protected _validateTransition(name: string, t: PageTransition) {
		if (process.env.NODE_ENV !== 'development') return;
		if (this._warnedTransitions.has(name)) return;
		this._warnedTransitions.add(name);

		const vtEnabled = this._config.viewTransition;

		if (t.cssMode && (t.leave || t.enter)) {
			console.warn(`[flyva] "${name}": leave/enter hooks are ignored when cssMode is enabled — CSS handles the animation`);
		}

		if (t.animateViewTransition && !vtEnabled) {
			console.warn(`[flyva] "${name}": animateViewTransition is defined but viewTransition is not enabled — this hook will never run`);
		}

		if (t.cssMode && t.animateViewTransition) {
			console.warn(`[flyva] "${name}": animateViewTransition is ignored when cssMode is enabled`);
		}

		if (t.concurrent && vtEnabled) {
			console.warn(`[flyva] "${name}": concurrent flag has no effect in viewTransition mode`);
		}

		if (t.viewTransitionNames && !vtEnabled && !t.cssMode) {
			console.warn(`[flyva] "${name}": viewTransitionNames requires viewTransition or cssMode to be enabled`);
		}
	}

	async beforeLeave(el?: Element) {
		this._stage.value = 'beforeLeave';
		applyLifecycleClasses('beforeLeave', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		promises.push(Promise.resolve(this._runningInstance.value?.beforeLeave?.(ctx)));
		for (const hook of this._activeHooks) {
			if (hook.beforeLeave) promises.push(hook.beforeLeave(ctx));
		}
		await Promise.all(promises);
	}

	async leave(el?: Element) {
		this._stage.value = 'leave';
		applyLifecycleClasses('leave', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		promises.push(this._runningInstance.value?.leave?.(ctx) ?? Promise.resolve());
		for (const hook of this._activeHooks) {
			if (hook.leave) promises.push(hook.leave(ctx));
		}
		await Promise.all(promises);
	}

	async afterLeave(el?: Element) {
		this._gcHooks.forEach(hook => {
			hook();
			this._gcHooks.delete(hook);
		});

		this._stage.value = 'afterLeave';
		applyLifecycleClasses('afterLeave', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		promises.push(Promise.resolve(this._runningInstance.value?.afterLeave?.(ctx)));
		for (const hook of this._activeHooks) {
			if (hook.afterLeave) promises.push(hook.afterLeave(ctx));
		}
		await Promise.all(promises);
	}

	async beforeEnter(el?: Element) {
		this._stage.value = 'beforeEnter';
		applyLifecycleClasses('beforeEnter', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		promises.push(Promise.resolve(this._runningInstance.value?.beforeEnter?.(ctx)));
		for (const hook of this._activeHooks) {
			if (hook.beforeEnter) promises.push(hook.beforeEnter(ctx));
		}
		await Promise.all(promises);
	}

	async enter(el?: Element) {
		this._stage.value = 'enter';
		applyLifecycleClasses('enter', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		promises.push(this._runningInstance.value?.enter?.(ctx) ?? Promise.resolve());
		for (const hook of this._activeHooks) {
			if (hook.enter) promises.push(hook.enter(ctx));
		}
		await Promise.all(promises);
	}

	async afterEnter(el?: Element) {
		this._stage.value = 'afterEnter';
		applyLifecycleClasses('afterEnter', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		promises.push(Promise.resolve(this._runningInstance.value?.afterEnter?.(ctx)));
		for (const hook of this._activeHooks) {
			if (hook.afterEnter) promises.push(hook.afterEnter(ctx));
		}
		await Promise.all(promises);
		this.finishTransition();
	}

	setContentElements(current?: Element, next?: Element) {
		this._currentContent = current;
		this._nextContent = next;
	}

	finishTransition() {
		this.runningInstance?.cleanup?.();
		this._runningInstance.value = undefined;
		this._runningName.value = undefined;
		this._isRunning.value = false;
		this._stage.value = 'none';
		this._currentContent = undefined;
		this._nextContent = undefined;
		applyLifecycleClasses('none', this.lifecycleClassPrefix);
	}

	registerActiveHook(registration: ActiveHookRegistration): RegisterActiveHookReturn {
		this._activeHooks.add(registration);
		return (cleanup) => {
			this._gcHooks.add(() => {
				this._activeHooks.delete(registration);
				cleanup?.();
			})
		};
	}

	getInstance<K extends keyof T>(name: K) {
		return this.transitions[name];
	}

	makeContext<O = PageTransitionOptions>(el?: Element): PageTransitionContext<O> {
		return {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			name: this._runningName.value! as string,
			options: this._currentOptions as O,
			trigger: this._trigger,
			el,
			current: this._currentContent,
			next: this._nextContent,
		};
	}
}
