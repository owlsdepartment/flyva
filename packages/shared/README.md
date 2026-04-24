# @flyva/shared

Framework-agnostic core for flyva page transitions. Provides the `PageTransitionManager` and the `PageTransition` lifecycle interface used by both `@flyva/next` and `@flyva/nuxt`.

> This package is an internal dependency — you don't install it directly. It's pulled in by the framework adapters.

## Import paths

Use **`@flyva/shared`** for the full barrel, or **`@flyva/shared/page-transition-manager`**, **`@flyva/shared/view-transition`**, **`@flyva/shared/lifecycle-classes`**, **`@flyva/shared/types`** for narrower surfaces (see `package.json` `exports`).

## PageTransition lifecycle

Every transition is a class (or plain object) implementing the `PageTransition` interface:

```ts
interface PageTransition {
  prepare?(context): Promise<void>;
  beforeLeave?(context): void;
  leave?(context): Promise<void>;
  afterLeave?(context): void;
  beforeEnter?(context): void;
  enter?(context): Promise<void>;
  afterEnter?(context): void;
  cleanup?(): void;
}
```

The lifecycle runs in order:

```
prepare → beforeLeave → leave → afterLeave → beforeEnter → enter → afterEnter → cleanup
```

- **prepare** — snapshot DOM state, cache element refs
- **leave** — animate the outgoing page (async, awaited)
- **enter** — animate the incoming page (async, awaited)
- **cleanup** — reset internal state

## PageTransitionManager

Orchestrates registered transitions. Each framework adapter wraps this with its own provider/plugin:

```ts
const manager = new PageTransitionManager(transitions, reactiveFactory);
manager.run('fadeTransition', { fromHref: '/', toHref: '/about' });
```

## PageTransitionContext

Every lifecycle method receives a context object:

```ts
interface PageTransitionContext {
  name: string;           // transition key
  trigger: string | Element;
  options: Record<string, any>;
  el?: Element;           // the trigger element (e.g. clicked link)
}
```
