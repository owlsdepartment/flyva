# @flyva/shared

Framework-agnostic core. This package is an internal dependency — it's re-exported by both `@flyva/next` and `@flyva/nuxt`.

## PageTransitionManager

Orchestrates the transition lifecycle. Each framework adapter creates an instance internally — you typically don't instantiate this yourself.

### Constructor

```ts
new PageTransitionManager(transitions, reactiveFactory)
```

| Param | Type | Description |
|-------|------|-------------|
| `transitions` | `Record<string, PageTransition>` | Map of named transition instances |
| `reactiveFactory` | `ReactiveFactory` | Framework-specific reactive value factory |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isRunning` | `boolean` | Whether a transition is currently active |
| `runningInstance` | `PageTransition \| undefined` | The currently active transition instance |
| `runningName` | `string \| undefined` | Key of the currently active transition |
| `stage` | `PageTransitionStage` | Current lifecycle stage |
| `readyPromise` | `Promise<void>` | Resolves when `prepare()` completes |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `run(name, options, trigger?)` | `Promise<void>` | Start a transition: sets running state and calls `prepare()` |
| `beforeLeave(el?)` | `void` | Run `beforeLeave` on the active transition |
| `leave(el?)` | `Promise<void>` | Run `leave` on the active transition |
| `afterLeave(el?)` | `void` | Run `afterLeave` on the active transition |
| `beforeEnter(el?)` | `void` | Run `beforeEnter` on the active transition |
| `enter(el?)` | `Promise<void>` | Run `enter` on the active transition |
| `afterEnter(el?)` | `void` | Run `afterEnter`, then `cleanup`. Resets running state. |
| `getInstance(name)` | `PageTransition` | Get a transition instance by key |

---

## PageTransition

Interface for transition implementations. All methods are optional.

```ts
interface PageTransition<O = PageTransitionOptions> {
  condition?(context: PageTransitionContext<O>): Promise<boolean> | boolean
  prepare?(context: PageTransitionContext<O>): Promise<void>
  beforeLeave?(context: PageTransitionContext<O>): void
  leave?(context: PageTransitionContext<O>): Promise<void>
  afterLeave?(context: PageTransitionContext<O>): void
  beforeEnter?(context: PageTransitionContext<O>): void
  enter?(context: PageTransitionContext<O>): Promise<void>
  afterEnter?(context: PageTransitionContext<O>): void
  cooldown?(context: PageTransitionContext<O>): Promise<void>
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

## PageTransitionContext

Passed to every lifecycle method.

```ts
interface PageTransitionContext<O = PageTransitionOptions> {
  name: string
  trigger: PageTransitionTrigger
  options: O
  el?: Element
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Transition key (e.g. `'fadeTransition'`) |
| `trigger` | `string \| Element` | `'internal'` for programmatic navigation, or the clicked DOM element |
| `options` | `O` | Merged options: `{ fromHref, toHref, ...flyvaOptions }` |
| `el` | `Element \| undefined` | The trigger DOM element (same as `trigger` when it's an Element) |

---

## PageTransitionStage

```ts
type PageTransitionStage =
  | 'none'
  | 'beforeLeave' | 'leave' | 'afterLeave'
  | 'beforeEnter' | 'enter' | 'afterEnter'
```

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
