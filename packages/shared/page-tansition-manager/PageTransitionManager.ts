import { Reactive, ReactiveFactory } from '../types';
import type {
	PageTransition,
	PageTransitionContext,
	PageTransitionOptions,
	PageTransitionStage,
	PageTransitionTrigger,
} from './types';

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

	constructor(protected transitions: T, protected reactiveFactory: ReactiveFactory<unknown, R>) {
		this._isRunning = this.reactiveFactory(false);
		this._runningInstance = this.reactiveFactory();
		this._runningName = this.reactiveFactory();
		this._stage = this.reactiveFactory('none');
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

		const el = trigger instanceof Element ? trigger : undefined;

		this._readyPromise = current?.prepare?.(this.makeContext(el)) ?? Promise.resolve();

		return this._readyPromise;
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

		this.runningInstance?.cleanup?.();
		this._runningInstance.value = undefined;
		this._runningName.value = undefined;
		this._isRunning.value = false;
		this._stage.value = 'none';
		this._currentContent = undefined;
		this._nextContent = undefined;
	}

	setContentElements(current?: Element, next?: Element) {
		this._currentContent = current;
		this._nextContent = next;
	}

	getInstance<K extends keyof T>(name: K) {
		return this.transitions[name];
	}

	protected makeContext<O = PageTransitionOptions>(el?: Element): PageTransitionContext<O> {
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
