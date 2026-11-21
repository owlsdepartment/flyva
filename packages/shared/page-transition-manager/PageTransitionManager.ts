import { applyLifecycleClasses } from '../lifecycle-classes';
import { createOutgoingContext } from '../outgoing';
import type { Reactive, ReactiveFactory } from '../types';
import type {
	ActiveHookRegistration,
	FlyvaNavigation,
	OutgoingHook,
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

function participatesInMatching(t: PageTransition, isHistory: boolean): boolean {
	const flag = t.history ?? true;
	return isHistory ? flag !== false : flag !== 'only';
}

export interface MatchTransitionKeyOptions<K = string> {
	/** History move being matched; enables `history` flag filtering and is exposed to `condition`. */
	navigation?: FlyvaNavigation;
	/** Used when no condition matches, before `defaultTransitionKey`. */
	fallbackKey?: K;
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

/** Called synchronously when a stage starts, before any hook of that stage runs. */
export type StageListener = (stage: PageTransitionStage) => void;

export interface PageTransitionManagerConfig {
	viewTransition?: boolean;
	lifecycleClassPrefix?: string;
	/** Fallback map key when no transition's `condition` matches (default `defaultTransition`). */
	defaultTransitionKey?: string;
	/** Global outgoing hooks, run for every concurrent transition before its own `prepareOutgoing`. */
	prepareOutgoing?: OutgoingHook | OutgoingHook[];
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
	protected _navigation?: FlyvaNavigation;
	protected _stage: Reactive<PageTransitionStage>;
	protected _currentContent?: HTMLElement;
	protected _nextContent?: HTMLElement;
	protected _warnedTransitions = new Set<string>();
	protected _config: PageTransitionManagerConfig;
	protected _activeHooks = new Set<ActiveHookRegistration>();
	protected _gcHooks = new Set<() => void>();
	protected _outgoingHooks = new Set<OutgoingHook>();
	protected _stageListeners = new Set<StageListener>();
	protected _contextExtensions: Record<string, unknown> = {};

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

		const outgoing = this._config.prepareOutgoing;
		for (const hook of Array.isArray(outgoing) ? outgoing : outgoing ? [outgoing] : []) {
			this._outgoingHooks.add(hook);
		}
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

	/** History move driving the running transition, if any. */
	get navigation() {
		return this._navigation;
	}

	/**
	 * Picks a transition by evaluating each registered `condition` in **priority order** (see
	 * {@link sortTransitionKeysForMatching}); the first match wins. Transitions without `condition`
	 * are skipped here, as are transitions excluded by their `history` flag for this kind of navigation.
	 * If none match, returns `match.fallbackKey` (when registered), then `defaultTransitionKey` from
	 * config (default `defaultTransition`).
	 */
	async matchTransitionKey(
		options: T[keyof T] extends PageTransition<infer O> ? O : PageTransitionOptions,
		el?: Element,
		match?: MatchTransitionKeyOptions<keyof T>,
	): Promise<keyof T> {
		const rec = options as Record<string, unknown>;
		const navigation = match?.navigation;
		const ctx: PageTransitionMatchContext = {
			fromHref: String(rec.fromHref ?? ''),
			toHref: String(rec.toHref ?? ''),
			options: options as PageTransitionOptions,
			trigger: el ?? (navigation ? 'history' : 'internal'),
			el,
			current: this._currentContent,
			next: this._nextContent,
			navigation,
		};

		const ordered = sortTransitionKeysForMatching(this.transitions);
		for (const key of ordered) {
			const t = this.transitions[key];
			if (!t?.condition) continue;
			if (!participatesInMatching(t, !!navigation)) continue;
			const ok = await Promise.resolve(t.condition.call(t, ctx));
			if (ok) return key;
		}

		const preferred = match?.fallbackKey;
		if (preferred !== undefined) {
			if (String(preferred) in this.transitions) return preferred;
			if (process.env.NODE_ENV === 'development') {
				console.warn(
					`[flyva] fallback transition key "${String(preferred)}" not in transitions map`,
				);
			}
		}

		const fb = (this._config.defaultTransitionKey ?? 'defaultTransition') as keyof T;
		if (!(String(fb) in this.transitions)) {
			const keys = sortTransitionKeysForMatching(this.transitions);
			const firstKey = keys[0];
			if (firstKey === undefined) {
				throw new Error('[flyva] No transitions registered');
			}
			if (process.env.NODE_ENV === 'development') {
				console.warn(
					`[flyva] defaultTransitionKey "${String(fb)}" not in transitions map; using "${String(firstKey)}"`,
				);
			}
			return firstKey;
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
		navigation?: FlyvaNavigation,
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
		this._trigger = trigger ?? (navigation ? 'history' : 'internal');
		this._navigation = navigation;

		if (current) this._validateTransition(name as string, current);

		const el = trigger instanceof Element ? trigger : undefined;

		this._stage.value = 'prepare';
		applyLifecycleClasses('prepare', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		this._emitStage('prepare');

		const ctx = this.makeContext(el);
		const prepares: Promise<void>[] = [];
		if (current?.prepare) prepares.push(Promise.resolve(current.prepare.call(current, ctx)));
		for (const hook of this._activeHooks) {
			if (hook.prepare) prepares.push(Promise.resolve(hook.prepare(ctx)));
		}
		this._readyPromise = prepares.length ? Promise.all(prepares).then(() => {}) : Promise.resolve();

		return this._readyPromise;
	}

	protected _emitStage(stage: PageTransitionStage) {
		for (const listener of this._stageListeners) listener(stage);
	}

	/** Registers a stage listener (adapter plumbing); returns an unregister function. */
	onStage(listener: StageListener): () => void {
		this._stageListeners.add(listener);
		return () => {
			this._stageListeners.delete(listener);
		};
	}

	/**
	 * Adds (or with `undefined`, removes) an adapter-specific field on every lifecycle context,
	 * e.g. `scroll` in `@flyva/next`.
	 */
	setContextExtension(key: string, value: unknown) {
		if (value === undefined) delete this._contextExtensions[key];
		else this._contextExtensions[key] = value;
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

		if (t.prepareOutgoing && !t.concurrent) {
			console.warn(
				`[flyva] "${name}": prepareOutgoing without concurrent only runs for Next history snapshot — ` +
					`it will not run on normal link navigations`,
			);
		}

		if (t.viewTransitionNames && !vtEnabled && !t.cssMode) {
			console.warn(
				`[flyva] "${name}": viewTransitionNames requires viewTransition or cssMode to be enabled`,
			);
		}
	}

	/**
	 * Runs outgoing hooks in order — global ({@link PageTransitionManagerConfig.prepareOutgoing} /
	 * {@link onPrepareOutgoing}), active hooks, then the running transition's `prepareOutgoing` —
	 * sequentially, since they reshape the same DOM. Pass `target` when the adapter leaves with a
	 * clone of `source`; it must still be an untouched clone at this point.
	 */
	async prepareOutgoing(source: HTMLElement, target: HTMLElement = source) {
		const inst = this._runningInstance.value;
		if (!inst) return;

		const ctx = createOutgoingContext(this.makeContext(), source, target);

		if (!inst.isolateOutgoing) {
			for (const hook of this._outgoingHooks) await hook(ctx);
			for (const hook of this._activeHooks) {
				if (hook.prepareOutgoing) await hook.prepareOutgoing(ctx);
			}
		}

		if (inst.prepareOutgoing) await inst.prepareOutgoing.call(inst, ctx);
	}

	/** Registers a global outgoing hook; returns an unregister function. */
	onPrepareOutgoing(hook: OutgoingHook): () => void {
		this._outgoingHooks.add(hook);
		return () => {
			this._outgoingHooks.delete(hook);
		};
	}

	async beforeLeave(el?: Element) {
		this._stage.value = 'beforeLeave';
		applyLifecycleClasses('beforeLeave', this.lifecycleClassPrefix, this._lifecycleTransitionKey());
		this._emitStage('beforeLeave');
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
		this._emitStage('leave');
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
		this._emitStage('afterLeave');
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
		this._emitStage('beforeEnter');
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
		this._emitStage('enter');
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
		this._emitStage('afterEnter');
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
		this._emitStage('cleanup');

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
		this._navigation = undefined;
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
			...this._contextExtensions,
			name: this._runningName.value! as string,
			fromHref: String(opts?.fromHref ?? ''),
			toHref: String(opts?.toHref ?? ''),
			options: this._currentOptions as O,
			trigger: this._trigger,
			el,
			current: cur,
			next: nxt,
			container,
			navigation: this._navigation,
		};
	}
}
