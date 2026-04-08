import type { Reactive, ReactiveFactory } from '../types';
import type {
	PageTransition,
	PageTransitionContext,
	PageTransitionOptions,
	PageTransitionStage,
	PageTransitionTrigger,
} from './types';

export interface PageTransitionManagerConfig {
	viewTransition?: boolean;
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

	beforeLeave(el?: Element) {
		this._stage.value = 'beforeLeave';
		this._runningInstance.value?.beforeLeave?.(this.makeContext(el));
	}

	async leave(el?: Element) {
		this._stage.value = 'leave';
		await this._runningInstance.value?.leave?.(this.makeContext(el));
	}

	afterLeave(el?: Element) {
		this._stage.value = 'afterLeave';
		this._runningInstance.value?.afterLeave?.(this.makeContext(el));
	}

	beforeEnter(el?: Element) {
		this._stage.value = 'beforeEnter';
		this._runningInstance.value?.beforeEnter?.(this.makeContext(el));
	}

	async enter(el?: Element) {
		this._stage.value = 'enter';
		await this._runningInstance.value?.enter?.(this.makeContext(el));
	}

	afterEnter(el?: Element) {
		this._stage.value = 'afterEnter';
		this._runningInstance.value?.afterEnter?.(this.makeContext(el));
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
