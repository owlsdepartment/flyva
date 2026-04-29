# Transition modes

Flyva always uses the same `PageTransition` lifecycle and `FlyvaLink` flow. **How** the outgoing and incoming views are animated depends on the mode you choose:

| Mode | You implement | Best when |
|------|----------------|-----------|
| **JS hooks** (default) | `leave` / `enter` (and other hooks) with any animation library | Full control, complex timelines, FLIP, imperative logic |
| **CSS mode** | Styles for generated `*-leave-*` / `*-enter-*` classes | Lightweight fades/slides, no JS animation dependency |
| **View Transitions** | Optional `viewTransitionNames`, `animateViewTransition`, plus CSS for `::view-transition-*` | Native cross-document feel, shared-element–style transitions in supporting browsers |

Only one animation path runs per navigation. Enabling **View Transitions** in app config changes how navigation is wrapped (`document.startViewTransition`); **`cssMode: true`** on a transition defers animation to those CSS class phases instead of your `leave`/`enter` (when VT is off). See [CSS mode](./css-mode) and [View Transitions](./view-transitions) for details and constraints.

## JS-based mode (default)

With neither `cssMode` nor app-level View Transitions, Flyva runs your hooks in order: `prepare` → `beforeLeave` → `leave` → … → `enter` → `afterEnter` → `cleanup`. You animate with anime.js, GSAP, Motion, Web Animations API, or manual `requestAnimationFrame`.

- **Sequential (default)** — `leave` finishes before the route updates, then `enter` runs on the new page.
- **`concurrent: true`** — leave can overlap navigation; the adapter keeps the old pixels on screen (**Next.js:** a DOM clone before `router.push`; **Nuxt:** Vue `<Transition>` timing without that clone) while the new tree mounts. Prefer `context.current` and `context.next` for the exact swap roots. On the **Next.js App Router**, concurrent mode is **fragile** because of cloning - layout shift, replayed CSS motion, and broken ref assumptions are common; see [Concurrent mode and content cloning](/guide/next/#concurrent-mode-and-content-cloning) or use [View Transitions](./view-transitions) for a native swap.

Patterns, `context.el`, options, and recipes live in [Writing transitions](../transitions).

## CSS mode (short)

Set `cssMode: true` on the transition. Flyva applies a fixed class sequence on the content root (`myTransition-leave-from`, `myTransition-leave-active`, …) and waits for CSS transitions/animations to finish. Your `leave` / `enter` hooks are **not** used for the animated phases (dev warns if you define them anyway).

Requires app-level View Transitions to be **off** for this path on Nuxt (see module behavior). Full naming, examples, and edge cases: [CSS mode](./css-mode).

## View Transitions (short)

Turn on `viewTransition: true` in **Next.js** (`FlyvaRoot` `config`) or **Nuxt** (`flyva` module options). `FlyvaLink` then performs navigation inside `document.startViewTransition`. On the transition object you can set `viewTransitionNames` (selector → `view-transition-name`) and optionally `animateViewTransition` after `vt.ready`.

`concurrent` does not apply in this path. If Nuxt’s global `app.viewTransition` is also on, disable one stack to avoid conflicts. Full setup: [View Transitions](./view-transitions).

## Where to read next

- [Lifecycle diagrams](./lifecycle) — Sequence diagrams comparing Flyva hooks with App Router behavior in each mode
- [Writing transitions](../transitions) — interface, class pattern, options, recipes (overlay, FLIP)
- [CSS mode](./css-mode) — class phases and CSS examples
- [View Transitions](./view-transitions) — config, naming map, hooks, shared helpers
