# @flyva/shared

**Core** of Flyva: framework-agnostic page transition logic. It defines the `PageTransition` lifecycle, `PageTransitionManager`, and shared helpers. The Next.js and Nuxt packages are thin adapters that wire this core into each framework’s router and reactivity.

Install **`@flyva/shared`** alongside the adapter you use; the adapters list it as a **peer dependency**, so your app resolves one shared version for both.

## Framework implementations

| Framework | Package | Docs |
| --- | --- | --- |
| **Next.js** (App Router) | [`@flyva/next` on npm](https://www.npmjs.com/package/@flyva/next) | [Next.js guide](https://flyva.js.org/docs/guide/next/) |
| **Nuxt** (module) | [`@flyva/nuxt` on npm](https://www.npmjs.com/package/@flyva/nuxt) | [Nuxt guide](https://flyva.js.org/docs/guide/nuxt/) |

Docs for the whole project (guides, API): [flyva.js.org](https://flyva.js.org). 

## Import paths

Use **`@flyva/shared`** for the full barrel, or **`@flyva/shared/page-transition-manager`**, **`@flyva/shared/view-transition`**, **`@flyva/shared/lifecycle-classes`**, **`@flyva/shared/types`** for narrower surfaces (see `package.json` `exports`).

## PageTransition lifecycle

Every transition is a class (or plain object) implementing the `PageTransition` interface:

```ts
interface PageTransition {
  prepare?(context): void | Promise<void>;
  beforeLeave?(context): void;
  leave?(context): void | Promise<void>;
  afterLeave?(context): void;
  beforeEnter?(context): void;
  enter?(context): void | Promise<void>;
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
