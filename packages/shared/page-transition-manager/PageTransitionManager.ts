import { applyLifecycleClasses } from '../lifecycle-classes';
import type { Reactive, ReactiveFactory } from '../types';
import type {
	ActiveHookRegistration,
	PageTransition,
	PageTransitionContext,
	PageTransitionMatchContext,
	PageTransitionOptions,
	PageTransitionStage,
	PageTransitionTrigger,
	RegisterActiveHookReturn,
} from './types';

function contentRootFromElement(node?: Element | null): HTMLElement | undefined {
	return node instanceof HTMLElement ? node : undefined;
}

/**
 * Order used when evaluating `condition` in {@link PageTransitionManager.matchTransitionKey}:
 * 1) descending numeric `priority`, 2) entries with `condition` but no `priority`, 3) rest — stable by original key order within each band.
 */
export function sortTransitionKeysForMatching<T extends Record<string, PageTransition>>(
	transitions: T,
): (keyof T)[] {
	const keys = Object.keys(transitions) as (keyof T)[];
	const origIndex = new Map<keyof T, number>(keys.map((k, i) => [k, i]));
	return [...keys].sort((ka, kb) => {
		const a = transitions[ka];
		const b = transitions[kb];
		const pa = a?.priority;
		const pb = b?.priority;
		const hasPa = typeof pa === 'number' && !Number.isNaN(pa);
		const hasPb = typeof pb === 'number' && !Number.isNaN(pb);
		if (hasPa && hasPb && pa !== pb) return (pb as number) - (pa as number);
		if (hasPa && !hasPb) return -1;
		if (!hasPa && hasPb) return 1;
		const condA = typeof a?.condition === 'function';
		const condB = typeof b?.condition === 'function';
		if (condA && !condB) return -1;
		if (!condA && condB) return 1;
		return (origIndex.get(ka) ?? 0) - (origIndex.get(kb) ?? 0);
	});
}

export interface PageTransitionManagerConfig {
	viewTransition?: boolean;
	lifecycleClassPrefix?: string;
	/** Fallback map key when no transition's `condition` matches (default `defaultTransition`). */
	defaultTransitionKey?: string;
}

export class PageTransitionManager<
	T extends Record<string, PageTransition> = Record<string, PageTransition>,
	R extends Reactive<unknown> = Reactive<unknown>,
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
	protected _currentContent?: HTMLElement;
	protected _nextContent?: HTMLElement;
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

	/**
	 * Picks a transition by evaluating each registered `condition` in **priority order** (see
	 * {@link sortTransitionKeysForMatching}); the first match wins. Transitions without `condition`
	 * are skipped here. If none match, returns `defaultTransitionKey` from config (default `defaultTransition`).
	 */
	async matchTransitionKey(
		options: T[keyof T] extends PageTransition<infer O> ? O : PageTransitionOptions,
		el?: Element,
	): Promise<keyof T> {
		const rec = options as Record<string, unknown>;
		const ctx: PageTransitionMatchContext = {
			fromHref: String(rec.fromHref ?? ''),
			toHref: String(rec.toHref ?? ''),
			options: options as PageTransitionOptions,
			trigger: el ?? 'internal',
			el,
			current: this._currentContent,
			next: this._nextContent,
		};

		const ordered = sortTransitionKeysForMatching(this.transitions);
		for (const key of ordered) {
			const t = this.transitions[key];
			if (!t?.condition) continue;
			const ok = await Promise.resolve(t.condition.call(t, ctx));
			if (ok) return key;
		}

		const fb = (this._config.defaultTransitionKey ?? 'defaultTransition') as keyof T;
		if (!(String(fb) in this.transitions)) {
			const keys = sortTransitionKeysForMatching(this.transitions);
			if (!keys.length) {
				throw new Error('[flyva] No transitions registered');
			}
			if (process.env.NODE_ENV === 'development') {
				console.warn(
					`[flyva] defaultTransitionKey "${String(fb)}" not in transitions map; using "${String(keys[0])}"`,
				);
			}
			return keys[0];
		}
		return fb;
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
		trigger?: PageTransitionTrigger,
	) {
		if (this.runningInstance) {
			const prev = this.runningInstance;
			prev.cleanup?.call(prev, this.makeContext(undefined));
		}

		const current = this.transitions[name];
		this._runningInstance.value = current;
		this._runningName.value = name;
		this._currentOptions = options;
		this._isRunning.value = true;
		this._trigger = trigger ?? 'internal';

		if (current) this._validateTransition(name as string, current);

		const el = trigger instanceof Element ? trigger : undefined;

		this._stage.value = 'prepare';
		applyLifecycleClasses('prepare', this.lifecycleClassPrefix, this._lifecycleTransitionKey());

		const ctx = this.makeContext(el);
		const prepares: Promise<void>[] = [];
		if (current?.prepare) prepares.push(Promise.resolve(current.prepare.call(current, ctx)));
		for (const hook of this._activeHooks) {
			if (hook.prepare) prepares.push(Promise.resolve(hook.prepare(ctx)));
		}
		this._readyPromise = prepares.length ? Promise.all(prepares).then(() => {}) : Promise.resolve();

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
			console.warn(
				`[flyva] "${name}": leave/enter hooks are ignored when cssMode is enabled — CSS handles the animation`,
			);
		}

		if (t.animateViewTransition && !vtEnabled) {
			console.warn(
				`[flyva] "${name}": animateViewTransition is defined but viewTransition is not enabled — this hook will never run`,
			);
		}

		if (t.cssMode && t.animateViewTransition) {
			console.warn(`[flyva] "${name}": animateViewTransition is ignored when cssMode is enabled`);
		}

		if (t.concurrent && vtEnabled) {
			console.warn(`[flyva] "${name}": concurrent flag has no effect in viewTransition mode`);
		}

		if (t.viewTransitionNames && !vtEnabled && !t.cssMode) {
			console.warn(
				`[flyva] "${name}": viewTransitionNames requires viewTransition or cssMode to be enabled`,
			);
		}
	}

	async beforeLeave(el?: Element) {
		this._stage.value = 'beforeLeave';
		applyLifecycleClasses('beforeLeave', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		const instBL = this._runningInstance.value;
		promises.push(
			Promise.resolve(instBL?.beforeLeave ? instBL.beforeLeave.call(instBL, ctx) : undefined),
		);
		for (const hook of this._activeHooks) {
			if (hook.beforeLeave) promises.push(Promise.resolve(hook.beforeLeave(ctx)));
		}
		await Promise.all(promises);
	}

	async leave(el?: Element) {
		this._stage.value = 'leave';
		applyLifecycleClasses('leave', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		const instL = this._runningInstance.value;
		promises.push(Promise.resolve(instL?.leave ? instL.leave.call(instL, ctx) : undefined));
		for (const hook of this._activeHooks) {
			if (hook.leave) promises.push(Promise.resolve(hook.leave(ctx)));
		}
		await Promise.all(promises);
	}

	protected flushPendingActiveHookGc(): void {
		this._gcHooks.forEach(hook => {
			hook();
			this._gcHooks.delete(hook);
		});
	}

	async afterLeave(el?: Element) {
		this.flushPendingActiveHookGc();

		this._stage.value = 'afterLeave';
		applyLifecycleClasses('afterLeave', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		const instALe = this._runningInstance.value;
		promises.push(
			Promise.resolve(instALe?.afterLeave ? instALe.afterLeave.call(instALe, ctx) : undefined),
		);
		for (const hook of this._activeHooks) {
			if (hook.afterLeave) promises.push(Promise.resolve(hook.afterLeave(ctx)));
		}
		await Promise.all(promises);
	}

	async beforeEnter(el?: Element) {
		this._stage.value = 'beforeEnter';
		applyLifecycleClasses('beforeEnter', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		const instBE = this._runningInstance.value;
		promises.push(
			Promise.resolve(instBE?.beforeEnter ? instBE.beforeEnter.call(instBE, ctx) : undefined),
		);
		for (const hook of this._activeHooks) {
			if (hook.beforeEnter) promises.push(Promise.resolve(hook.beforeEnter(ctx)));
		}
		await Promise.all(promises);
	}

	async enter(el?: Element) {
		this._stage.value = 'enter';
		applyLifecycleClasses('enter', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		const instE = this._runningInstance.value;
		promises.push(Promise.resolve(instE?.enter ? instE.enter.call(instE, ctx) : undefined));
		for (const hook of this._activeHooks) {
			if (hook.enter) promises.push(Promise.resolve(hook.enter(ctx)));
		}
		await Promise.all(promises);
	}

	async afterEnter(el?: Element) {
		this._stage.value = 'afterEnter';
		applyLifecycleClasses('afterEnter', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		const ctx = this.makeContext(el);
		const promises: Promise<void>[] = [];
		const instAE = this._runningInstance.value;
		promises.push(
			Promise.resolve(instAE?.afterEnter ? instAE.afterEnter.call(instAE, ctx) : undefined),
		);
		for (const hook of this._activeHooks) {
			if (hook.afterEnter) promises.push(Promise.resolve(hook.afterEnter(ctx)));
		}
		await Promise.all(promises);
		this.finishTransition();
	}

	setContentElements(current?: Element | null, next?: Element | null) {
		this._currentContent = contentRootFromElement(current);
		this._nextContent = contentRootFromElement(next);
	}

	finishTransition(): void {
		const inst = this.runningInstance;
		const key = this._lifecycleTransitionKey();

		this._stage.value = 'cleanup';
		applyLifecycleClasses('cleanup', this.lifecycleClassPrefix, key);

		const cleanupCtx = this.makeContext(undefined);

		for (const hook of this._activeHooks) {
			hook.cleanup?.();
		}

		inst?.cleanup?.call(inst, cleanupCtx);

		this._runningInstance.value = undefined;
		this._runningName.value = undefined;
		this._isRunning.value = false;
		this._stage.value = 'none';
		this._currentContent = undefined;
		this._nextContent = undefined;
		applyLifecycleClasses('none', this.lifecycleClassPrefix);
		this.flushPendingActiveHookGc();
	}

	flushDeferredActiveHookCleanupsIfIdle(): void {
		if (this._isRunning.value) return;
		this.flushPendingActiveHookGc();
	}

	registerActiveHook(registration: ActiveHookRegistration): RegisterActiveHookReturn {
		this._activeHooks.add(registration);
		return cleanup => {
			this._gcHooks.add(() => {
				this._activeHooks.delete(registration);
				cleanup?.();
			});
		};
	}

	getInstance<K extends keyof T>(name: K) {
		return this.transitions[name];
	}

	makeContext<O = PageTransitionOptions>(el?: Element): PageTransitionContext<O> {
		const opts = this._currentOptions as Record<string, unknown>;
		const stage = this._stage.value;
		const cur = this._currentContent;
		const nxt = this._nextContent;
		const container =
			stage === 'beforeEnter' || stage === 'enter' || stage === 'afterEnter'
				? (nxt ?? cur)
				: (cur ?? nxt);
		return {
			name: this._runningName.value! as string,
			fromHref: String(opts?.fromHref ?? ''),
			toHref: String(opts?.toHref ?? ''),
			options: this._currentOptions as O,
			trigger: this._trigger,
			el,
			current: cur,
			next: nxt,
			container,
		};
	}
}
