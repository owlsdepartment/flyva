# Getting Started

## What is Flyva?

Flyva is a small library for creating smooth, animated page transitions in **Next.js** and **Nuxt** applications. Instead of letting the browser hard-reload between pages, Flyva intercepts navigation, runs your leave animation, swaps the content, then runs your enter animation.

It doesn't ship any animations itself — you bring your own using any JS animation library (anime.js, GSAP, Motion, etc.) or plain CSS. Flyva handles the orchestration and framework plumbing.

## How it works

When a user clicks a `FlyvaLink`:

1. **Intercept** — the click is prevented; the URL and trigger element are captured
2. **Prepare** — your transition snapshots any DOM state it needs (rects, refs, clones)
3. **Leave** — the outgoing page animates out
4. **Navigate** — the framework pushes the new route, the DOM updates
5. **Enter** — the incoming page animates in
6. **Cleanup** — the transition resets itself for the next run

This all happens through a `PageTransition` object — a class (or plain object) with lifecycle hooks that you implement:

```
prepare → beforeLeave → leave → afterLeave → beforeEnter → enter → afterEnter → cleanup
```

Every hook is optional. A minimal transition only needs `leave` and `enter`.

## The transition lifecycle

| Hook | Async | When it runs |
|------|-------|-------------|
| `prepare` | yes | Before anything animates. Snapshot DOM rects, cache element refs, clone nodes. |
| `beforeLeave` | no | Synchronous setup right before leave. Disable pointer events, add overlay classes. |
| `leave` | yes | Animate the outgoing content. Awaited — navigation won't happen until this resolves. |
| `afterLeave` | no | Synchronous teardown after leave. Clean up styles from the leave phase. |
| `beforeEnter` | no | Synchronous setup before enter. Set initial styles on the incoming content (e.g. `opacity: 0`). |
| `enter` | yes | Animate the incoming content. Awaited — the transition isn't "done" until this resolves. |
| `afterEnter` | no | Final cleanup. Remove overlay classes, log analytics. |
| `cleanup` | no | Called after `afterEnter`. Null out all cached references. |

## Context object

Every lifecycle hook receives a `PageTransitionContext`:

```ts
interface PageTransitionContext {
  name: string;              // the transition key (e.g. "fadeTransition")
  trigger: string | Element; // "internal" or the clicked DOM element
  options: Record<string, any>;
  el?: Element;              // the trigger element (the FlyvaLink that was clicked)
}
```

`options` always contains `fromHref` and `toHref` (set automatically), plus anything you pass via `flyvaOptions` / `:flyva-options` on the link.

## Choosing Next.js or Nuxt

| | Next.js | Nuxt |
|--|---------|------|
| Package | `@flyva/next` | `@flyva/nuxt` |
| Integration | React context provider (`FlyvaRoot`) | Nuxt module with auto-imports |
| Transition registration | Explicit map in a client component | Auto-discovered from a directory |
| Link component | `FlyvaLink` wraps `next/link` | `FlyvaLink` wraps `NuxtLink` |
| Shared element refs | `useRefStack` hook | `useRefStack` composable (auto-imported) |

## Install

::: code-group

```bash [Next.js]
pnpm add @flyva/next @flyva/shared
```

```bash [Nuxt]
pnpm add @flyva/nuxt @flyva/shared
```

:::

Continue with the [Next.js guide](./next) or the [Nuxt guide](./nuxt).
