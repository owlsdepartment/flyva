# @flyva/shared

Framework-agnostic core. This package is an internal dependency - it's re-exported by both `@flyva/next` and `@flyva/nuxt`.

## Import paths

| Subpath | Contents |
|---------|----------|
| **`@flyva/shared`** | Full barrel: transition types, `defineTransition`, `PageTransitionManager`, view-transition helpers, lifecycle helpers |
| **`@flyva/shared/page-transition-manager`** | `PageTransitionManager`, `defineTransition`, and transition-related types |
| **`@flyva/shared/view-transition`** | View Transitions helpers (`supportsViewTransitions`, `applyViewTransitionNames`, CSS stage helpers, …) |
| **`@flyva/shared/lifecycle-classes`** | `applyLifecycleClasses`, `FLYVA_TRANSITION_DATA_ATTR` |
| **`@flyva/shared/types`** | `Reactive`, `ReactiveFactory` (used when wiring a custom `ReactiveFactory` into `PageTransitionManager`) |

Prefer the package root when you need several areas; use a subpath when you want a narrower import surface (e.g. only view-transition utilities).

## PageTransitionManager

Orchestrates the transition lifecycle. Each framework adapter creates an instance internally - you typically don't instantiate this yourself.

### Constructor

```ts
new PageTransitionManager(transitions, reactiveFactory, config?)
```

| Param | Type | Description |
|-------|------|-------------|
| `transitions` | `Record<string, PageTransition>` | Map of named transition instances |
| `reactiveFactory` | `ReactiveFactory` | Framework-specific reactive value factory |
| `config` | `PageTransitionManagerConfig` | Manager configuration (see below) |

**PageTransitionManagerConfig:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `viewTransition` | `boolean` | `undefined` | When `true`, dev warnings reference VT-specific rules |
| `lifecycleClassPrefix` | `string` | `'flyva'` | Prefix for lifecycle CSS classes on `document.documentElement`; `data-flyva-transition` is not prefixed and always holds the transition map key |
| `defaultTransitionKey` | `string` | `'defaultTransition'` | Map key used when no transition’s `condition` matches during `matchTransitionKey` |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isRunning` | `boolean` | Whether a transition is currently active |
| `runningInstance` | `PageTransition \| undefined` | The currently active transition instance |
| `runningName` | `string \| undefined` | Key of the currently active transition |
| `stage` | `PageTransitionStage` | Current lifecycle stage |
| `readyPromise` | `Promise<void>` | Resolves when `prepare()` completes |
| `currentContent` | `Element \| undefined` | Outgoing content root set via `setContentElements` |
| `nextContent` | `Element \| undefined` | Incoming content root set via `setContentElements` |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `run(name, options, trigger?)` | `Promise<void>` | Start a transition: sets running state, then awaits the active transition’s `prepare` and every registered active-hook `prepare` in parallel (`Promise.all`) |
| `matchTransitionKey(options, el?)` | `Promise<keyof T>` | When the link omits an explicit transition key, pick one: iterate in **priority order** (see `PageTransition.priority` and `sortTransitionKeysForMatching`), await each `condition` until the first truthy result; otherwise return `defaultTransitionKey` |
| `beforeLeave(el?)` | `Promise<void>` | Run `beforeLeave` on the active transition + registered active hooks |
| `leave(el?)` | `Promise<void>` | Run `leave` on the active transition + registered active hooks |
| `afterLeave(el?)` | `Promise<void>` | Run `afterLeave` on the active transition + registered active hooks |
| `beforeEnter(el?)` | `Promise<void>` | Run `beforeEnter` on the active transition + registered active hooks |
| `enter(el?)` | `Promise<void>` | Run `enter` on the active transition + registered active hooks |
| `afterEnter(el?)` | `Promise<void>` | Run `afterEnter` + active hooks, then `finishTransition()` (sync): active-hook `cleanup`, transition `cleanup`, reset state |
| `setContentElements(current?, next?)` | `void` | Store content roots (`HTMLElement`); accepts `Element` but non-`HTMLElement` nodes are ignored |
| `makeContext(el?)` | `PageTransitionContext` | Build context for the active transition (used by adapters) |
| `finishTransition()` | `void` | Run active-hook `cleanup`, transition `cleanup()`, clear running state, content refs, and lifecycle classes |
| `registerActiveHook(registration)` | `(cleanup?: () => void) => void` | Register an `ActiveHookRegistration`; returns an unregister function |
| `getInstance(name)` | `PageTransition` | Get a transition instance by key |

### `sortTransitionKeysForMatching(transitions)`

Returns map keys sorted for **`matchTransitionKey`**: descending numeric **`priority`**, then transitions with **`condition`** but no `priority` (original key order), then entries without `condition`. Exported for tests and tooling; the manager uses it internally.

---

## PageTransition

Interface for transition implementations. All methods are optional.

```ts
interface PageTransition<O = PageTransitionOptions> {
  concurrent?: boolean
  cssMode?: boolean
  priority?: number
  viewTransitionNames?: Record<string, string> | ((ctx: PageTransitionContext<O>) => Record<string, string>)
  animateViewTransition?(viewTransition: ViewTransition, context: PageTransitionContext<O>): void | Promise<void>
  condition?(context: PageTransitionMatchContext<O>): Promise<boolean> | boolean
  prepare?(context: PageTransitionContext<O>): void | Promise<void>
  beforeLeave?(context: PageTransitionContext<O>): void
  leave?(context: PageTransitionContext<O>): void | Promise<void>
  afterLeave?(context: PageTransitionContext<O>): void
  beforeEnter?(context: PageTransitionContext<O>): void
  enter?(context: PageTransitionContext<O>): void | Promise<void>
  afterEnter?(context: PageTransitionContext<O>): void
  cooldown?(context: PageTransitionContext<O>): void | Promise<void>
  cleanup?(): void
}
```

The generic `O` lets you type your transition's options for better autocomplete:

```ts
interface SlideOptions extends PageTransitionOptions {
  direction?: 'left' | 'right';
}

class Slide implements PageTransition<SlideOptions> {
  async leave(context: PageTransitionContext<SlideOptions>) {
    context.options.direction // typed as 'left' | 'right' | undefined
  }
}
```

---

## PageTransitionMatchContext

Passed **only** to `PageTransition.condition` while resolving which map key to run. It is a subset of the full lifecycle context: there is no `name` yet (the transition has not been chosen) and no `viewTransition`.

```ts
interface PageTransitionMatchContext<O = PageTransitionOptions> {
  fromHref: string
  toHref: string
  options: O
  trigger: PageTransitionTrigger
  el?: Element
  current?: HTMLElement
  next?: HTMLElement
}
```

| Field | Type | Description |
|-------|------|-------------|
| `fromHref` | `string` | Path the navigation leaves from |
| `toHref` | `string` | Path the navigation targets |
| `options` | `O` | Same object later passed to `prepare` / hooks: `{ fromHref, toHref, ...flyvaOptions }` |
| `trigger` | `PageTransitionTrigger` | Clicked element when available, otherwise `'internal'` |
| `el` | `Element \| undefined` | Anchor (or control) that started the navigation when known |
| `current` / `next` | `HTMLElement \| undefined` | Content roots if the manager already tracked them (often empty at match time) |

---

## PageTransitionContext

Passed to every lifecycle method (`prepare` through `afterEnter`). Extends `PageTransitionMatchContext` with the resolved key and optional View Transition handle.

```ts
interface PageTransitionContext<O = PageTransitionOptions> extends PageTransitionMatchContext<O> {
  name: string
  viewTransition?: ViewTransition
  container?: HTMLElement
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Transition key (e.g. `'fadeTransition'`) |
| `trigger` | `string \| Element` | `'internal'` for programmatic navigation, or the clicked DOM element |
| `options` | `O` | Merged options: `{ fromHref, toHref, ...flyvaOptions }` |
| `fromHref` | `string` | Same as `options.fromHref` |
| `toHref` | `string` | Same as `options.toHref` |
| `el` | `Element \| undefined` | The trigger DOM element (same as `trigger` when it's an Element) |
| `current` | `HTMLElement \| undefined` | Outgoing content root when the adapter set it |
| `next` | `HTMLElement \| undefined` | Incoming content root when the adapter set it |
| `container` | `HTMLElement \| undefined` | Convenience root for the active phase (outgoing during leave-related hooks, incoming during enter-related hooks) |
| `viewTransition` | `ViewTransition \| undefined` | Active View Transition when using that navigation path |

---

## PageTransitionStage

```ts
type PageTransitionStage =
  | 'none'
  | 'prepare'
  | 'cleanup'
  | 'beforeEnter' | 'enter' | 'afterEnter'
  | 'beforeLeave' | 'leave' | 'afterLeave'
```

Values reflect the hook currently executing, not the full pipeline order.

---

## PageTransitionOptions

```ts
interface PageTransitionOptions {
  [key: string]: any
}
```

---

## PageTransitionTrigger

```ts
type PageTransitionTrigger = string | 'internal' | Element
```

---

## Reactive / ReactiveFactory

Abstraction over framework-specific reactivity. Used internally by `PageTransitionManager`.

```ts
type Reactive<T> = { value: T }

type ReactiveFactory<T, R extends Reactive<T>> =
  <V = T>(initialValue?: V) => Reactive<V>
```

Each adapter supplies its own implementation:
- **React** — proxy-based ref that triggers re-renders
- **Vue** — wraps Vue's `ref()`

---

## ActiveHookRegistration

Used with `registerActiveHook()` to participate in the transition lifecycle from outside the transition definition. All fields are optional.

At each stage the manager runs the **transition** hook and **every** registered active hook. Sync hooks (`beforeLeave`, `afterLeave`, `beforeEnter`, `afterEnter`) are wrapped with `Promise.resolve` so they participate in the same `Promise.all` batch as async steps. `prepare`, `leave`, and `enter` may return **`void`** or **`Promise<void>`**; the manager normalizes with `Promise.resolve` before awaiting.

```ts
interface ActiveHookRegistration {
  prepare?(context: PageTransitionContext): void | Promise<void>
  beforeLeave?(context: PageTransitionContext): void
  leave?(context: PageTransitionContext): void | Promise<void>
  afterLeave?(context: PageTransitionContext): void
  beforeEnter?(context: PageTransitionContext): void
  enter?(context: PageTransitionContext): void | Promise<void>
  afterEnter?(context: PageTransitionContext): void
  cleanup?(): void
}
```

`cleanup` runs synchronously inside `finishTransition()` (no context argument).

Used internally by `useFlyvaLifecycle` in both Next.js and Nuxt (always registered). You can also call `registerActiveHook` directly for framework-agnostic integrations.

---

## Lifecycle classes (`lifecycle-classes.ts`)

`applyLifecycleClasses(stage, prefix, transitionKey?)` updates `document.documentElement` (`<html>`): prefixed CSS classes follow the Barba.js / Vue transition convention, and an optional **`data-flyva-transition`** attribute mirrors the **transition map key** (e.g. `defaultTransition`, `overlayTransition`) for the whole swap until `none`.

Export **`FLYVA_TRANSITION_DATA_ATTR`** (`'data-flyva-transition'`) if you want to reference the attribute name without string literals.

| Stage | Classes added | Classes removed |
|-------|---------------|-----------------|
| `beforeLeave` | `{prefix}-running`, `{prefix}-leave`, `{prefix}-leave-active` | all previous |
| `leave` | `{prefix}-leave-to` | `{prefix}-leave` |
| `afterLeave` | `{prefix}-pending` | `{prefix}-leave-active`, `{prefix}-leave-to` |
| `beforeEnter` | `{prefix}-enter`, `{prefix}-enter-active` | `{prefix}-pending` |
| `enter` | `{prefix}-enter-to` | `{prefix}-enter` |
| `afterEnter` | - | `{prefix}-enter-active`, `{prefix}-enter-to` |
| `none` | - | all lifecycle classes + `data-flyva-transition` removed |

`{prefix}-running` stays from `beforeLeave` through `afterEnter` (until `finishTransition`). `{prefix}-pending` covers the gap after leave hooks and before enter. If `transitionKey` is omitted or empty, `data-flyva-transition` is not set (or is removed on that call).

Called automatically by `PageTransitionManager` at each stage change and in `finishTransition()` (with the current running transition key).

---

## View transition & CSS helpers (`view-transition.ts`)

Exported from `@flyva/shared` for transitions and adapters.

| Export | Description |
|--------|-------------|
| `supportsViewTransitions()` | `true` when `document.startViewTransition` exists |
| `applyViewTransitionNames(names, context)` | Resolves a map or callback to selectors, sets `view-transition-name` on matched elements, returns the resolved map |
| `clearViewTransitionNames(names)` | Clears names using the same selector map |
| `waitForAnimation(el)` | Resolves after CSS transitions/animations on `el` complete (or timeout) |
| `applyCssStageClasses(el, name, phase)` | Drives `${name}-${phase}-from/active/to` class sequence for `phase` `'leave'` \| `'enter'` |
