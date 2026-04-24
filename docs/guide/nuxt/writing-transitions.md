# Writing transitions (Nuxt)

Flyva doesn't ship any built-in animations. This page covers the **JS hook** style: lifecycle, patterns, and recipes. For **CSS-driven** or **View Transitions** setups, start at [Transition modes](/guide/nuxt/transition-modes).

You implement transitions using whatever animation library fits your project (anime.js, GSAP, Motion, etc.). The sections below focus on the shared interface and common patterns. Import `PageTransition`, `PageTransitionContext`, and `PageTransitionMatchContext` from `@flyva/shared` when typing implementations.

## The interface

A transition is any object that implements (some of) these hooks:

```ts
interface PageTransition {
  concurrent?: boolean;
  cssMode?: boolean;
  priority?: number;
  viewTransitionNames?: Record<string, string> | ((ctx) => Record<string, string>);
  animateViewTransition?(vt: ViewTransition, context): Promise<void>;
  condition?(context: PageTransitionMatchContext): boolean | Promise<boolean>;
  prepare?(context): Promise<void>;
  beforeLeave?(context): void;
  leave?(context): Promise<void>;
  afterLeave?(context): void;
  beforeEnter?(context): void;
  enter?(context): Promise<void>;
  afterEnter?(context): void;
  cooldown?(context): Promise<void>;
  cleanup?(): void;
}
```

All hooks are optional. A transition that only defines `leave` and `enter` is perfectly valid.

| Flag / field | Effect |
|--------------|--------|
| `concurrent` | Outgoing and incoming content can overlap. On **Nuxt**, **`FlyvaPage` / Vue `<Transition>`** coordinate timing without a DOM clone; `context.current` / `context.next` point at the roots being handed off. Ignored when [View Transitions mode](/guide/nuxt/view-transition-api) is on. |
| `cssMode` | Animation via generated CSS classes instead of `leave`/`enter`. See [CSS mode](/guide/nuxt/transition-modes#css-mode). |
| `viewTransitionNames` | Used with app-level View Transitions. See [View Transitions mode](/guide/nuxt/view-transition-api). |
| `animateViewTransition` | Optional hook after `vt.ready` when using View Transitions. See [View Transitions mode](/guide/nuxt/view-transition-api). |
| `condition` | Optional predicate used **only** when the link did not set an explicit transition key. The manager walks registered transitions in **priority order** (see `priority` below), evaluates each `condition` with a [`PageTransitionMatchContext`](/api/shared#pagetransitionmatchcontext), and runs the **first** transition whose `condition` is truthy. Transitions without `condition` are never auto-selected this way. |
| `priority` | Optional **number** for [`matchTransitionKey`](/api/shared#pagetransitionmanager) only. Higher values are tried before lower ones. Entries **without** `priority` but **with** `condition` come next (stable map key order). Entries **without** `condition` are last. Use this when the transition map is auto-imported from files and key order is not enough. |

::: tip Next.js uses a clone for concurrent overlap
On **Next.js (App Router)**, `concurrent: true` relies on a **DOM clone** before `router.push`, with different ref and CSS replay caveats. If you maintain both stacks, read [Writing transitions (Next.js)](/guide/next/writing-transitions) and [Concurrent mode and content cloning](/guide/next/#concurrent-mode-and-content-cloning).
:::

::: warning Template refs during async leave
The outgoing page can **unmount before** async `leave` finishes, so a normal template **`ref`** may flip to **`null`** mid-animation. Use **`useFlyvaStickyRef()`** for DOM you must keep stable through that window (see [Nuxt overview](/guide/nuxt/#useflyvalifecycle-and-template-refs)).
:::

## Transition resolution

When a user clicks a `FlyvaLink`, the framework adapter decides which transition to run:

1. If the link has `flyva-transition` set to a non-empty string, that key is used.
2. Otherwise the manager calls `matchTransitionKey`: it iterates transitions in **priority order** ([`sortTransitionKeysForMatching`](/api/shared#sorttransitionkeysformatching) - higher `priority` first, then `condition` without `priority`, then the rest), runs each transition’s `condition` (if defined), and uses the **first** match.
3. If no `condition` matches, the manager uses `defaultTransitionKey` (`flyva.defaultKey` in runtime config). That defaults to `'defaultTransition'`.

The key must exist on the auto-built transition map from your transitions directory.

### `condition` vs explicit keys

Use an explicit `flyva-transition` when the same target URL could match more than one rule and you need a deterministic choice (for example project cards to `/work/[slug]` use `expandTransition` while the nav “Work” link targets `/work` and relies on `slideTransition`’s `condition`).

## Class-based vs functional pattern

The same lifecycle API works either way. A **class** with a **`new`** singleton is a good fit if you like private fields and instance methods. **`defineTransition`** from **`@flyva/shared`** builds a **`PageTransition`** from a plain object - often closer to how **Vue** codebases express composables or small config objects, without writing a `class`. Both styles get the same **`context`**; with **`defineTransition`**, hook methods still run with **`this`** bound to the returned object if you use normal **`method() {}`** syntax.

```ts
import { animate } from 'animejs';
import type { PageTransition, PageTransitionContext } from '@flyva/shared';

class SlideTransitionClass implements PageTransition {
  private content: HTMLElement | null = null;

  async prepare(context: PageTransitionContext) {
    this.content = context.container ?? null;
  }

  async leave(context: PageTransitionContext) {
    const el = this.content ?? context.container ?? null;
    if (!el) return;
    const dir = context.options.direction === 'left' ? '100%' : '-100%';
    await animate(el, {
      translateX: dir,
      opacity: 0,
      duration: 500,
      ease: 'inOutCubic',
    });
  }

  beforeEnter(context: PageTransitionContext) {
    this.content = context.container ?? null;
    if (!this.content) return;
    const dir = context.options.direction === 'left' ? '-100%' : '100%';
    this.content.style.transform = `translateX(${dir})`;
    this.content.style.opacity = '0';
  }

  async enter(context: PageTransitionContext) {
    const el = this.content ?? context.container ?? null;
    if (!el) return;
    await animate(el, {
      translateX: '0%',
      opacity: 1,
      duration: 500,
      ease: 'inOutCubic',
    });
  }

  cleanup() {
    if (this.content) {
      this.content.style.transform = '';
      this.content.style.opacity = '';
    }
    this.content = null;
  }
}

export const slideTransition = new SlideTransitionClass();
```

Export **one shared instance** (class or **`defineTransition`** result): the manager reuses it across navigations, and **`cleanup()`** should drop any cached DOM references.

## Using `context.current`, `context.next`, and `container`

The manager records the outgoing and incoming page roots for you via `FlyvaPage`. Read them from **`PageTransitionContext`** so you animate the subtree the adapter is swapping - not whatever happens to match a global **`document.querySelector`**.

- **`context.current`** — element that is leaving
- **`context.next`** — element that is entering, once it exists
- **`context.container`** — convenience pointer for the active phase: outgoing during leave-related hooks, incoming during enter-related hooks (same object as in [`PageTransitionContext`](/api/shared#pagetransitioncontext))

Use **`container`** when you only need the main root for this step; use **`current`** / **`next`** when you need the explicit pair.

## Using context.el

When a user clicks a `FlyvaLink`, `context.el` is set to the DOM element that was clicked. This is useful for shared element / FLIP transitions where you need to know the starting position of the trigger:

```ts
async prepare(context: PageTransitionContext) {
  if (context.el instanceof HTMLElement) {
    const rect = context.el.getBoundingClientRect();
    const snapshot = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    // on a class / defineTransition instance, assign to fields for leave/enter (e.g. this.snapshot = snapshot)
  }
}
```

## Navigation context (`fromHref`, `toHref`)

Adapters pass the current and target paths into the options object as **`fromHref`** and **`toHref`** (pathname-style strings, no query). They are duplicated on the context for convenience:

- `context.fromHref` / `context.toHref` — same values as `context.options.fromHref` / `context.options.toHref`
- **`PageTransitionMatchContext`** (passed only to `condition`) includes the same fields plus `options`, so you can branch on URL **and** on merged link options (for example `direction` from `:flyva-options`).

`condition` runs **before** `prepare`; `name` is not set yet on the match context.

## Using options

Pass per-link data via `:flyva-options`. They are shallow-merged into the object passed to `prepare` / lifecycle hooks together with `fromHref` and `toHref`:

```vue
<FlyvaLink to="/work" :flyva-options="{ direction: 'left', color: '#000' }">
  Back
</FlyvaLink>
```

Read them in your transition:

```ts
async leave(context: PageTransitionContext) {
  const direction = context.options.direction ?? 'right';
  const color = context.options.color ?? '#fff';
  // ...
}
```

## Lifecycle classes on `<html>`

Flyva automatically updates `document.documentElement` (`<html>`) at each transition stage: **prefixed classes** (Barba / Vue style), a **`flyva-running`** span class, **`flyva-pending`** between leave and enter, and **`data-flyva-transition="<key>"`** where `<key>` is the transition object’s key in your map (e.g. `defaultTransition`, `overlayTransition`). The prefix defaults to `flyva` and is configurable via `lifecycleClassPrefix`.

| Stage | Classes added | Classes removed |
|-------|---------------|-----------------|
| `beforeLeave` | `flyva-running`, `flyva-leave`, `flyva-leave-active` | all previous |
| `leave` | `flyva-leave-to` | `flyva-leave` |
| `afterLeave` | `flyva-pending` | `flyva-leave-active`, `flyva-leave-to` |
| `beforeEnter` | `flyva-enter`, `flyva-enter-active` | `flyva-pending` |
| `enter` | `flyva-enter-to` | `flyva-enter` |
| `afterEnter` | - | `flyva-enter-active`, `flyva-enter-to` |
| `none` (finish) | - | all of the above + `data-flyva-transition` |

Use **`html.flyva-running`** for styles that should cover the **entire** swap (including the pending gap). Use **`html[data-flyva-transition="overlayTransition"]`** (or any key) to branch CSS per transition - for example hide a global progress bar when an overlay transition already provides its own chrome.

See [Lifecycle CSS classes on `<html>`](/guide/nuxt/transition-modes#lifecycle-css-classes-on-html) on the transition modes page for diagrams, class timeline, and configuration.

## Recipes

### Overlay during transition

Use the [lifecycle classes](#lifecycle-classes-on-html) on `<html>` to show an overlay or disable interactions without any JS:

```css
html.flyva-running::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: auto;
}
```

You can also toggle **`pointer-events`** (or other inline styles) on **`context.container`** in hooks if you only need to shield the swapping subtree.

### Interactive overlay with `useDetachedRoot`

For a **rich overlay** (extra DOM, nested framework components, long GSAP / Motion timelines) that should exist **only for one transition run** and stay **in sync** with **`prepare` → leave → enter → cleanup**, mount it with **`useDetachedRoot`** (auto-imported from **`@flyva/nuxt`**). It appends a container to **`document.body`**, renders a small **Vue** tree with **`createApp`**, and returns **`{ refs, waitForRender, destroy }`**. You own timing: await **`waitForRender()`** after mounting, animate in **`leave`** / **`enter`** using the same **`PageTransitionContext`** as the page, then call **`destroy()`** in **`afterEnter`** and/or **`cleanup()`** so nothing leaks into the next navigation.

Another valid pattern is an overlay **component in the layout** toggled from **`useFlyvaLifecycle`** or shared state - that keeps one shell across routes. **`useDetachedRoot`** is a better fit when the overlay is **scoped to a single transition implementation** and you want it **gone as soon as that transition finishes**, without wiring layout props or global stores.

The playground **`overlayTransition`** (Next and Nuxt) is a full example: many refs, imperative timelines, and teardown in **`cleanup()`**.

```ts
import { h } from 'vue';
import { useDetachedRoot } from '@flyva/nuxt/composables';

type OverlayRefs = { root: HTMLDivElement | null };

const { refs, waitForRender, destroy } = useDetachedRoot(r =>
  h('div', { ref: r.root, class: 'overlay', role: 'presentation' }),
);

await waitForRender();
// refs.root.value … then destroy();
destroy();
```

::: tip Not tied to Flyva internals
`useDetachedRoot` is a thin **client-only** helper around a body-mounted root. You can use it **anywhere** in an app (modals, tooling, one-off portals) whenever that model fits - it does **not** require **`FlyvaRoot`**, **`PageTransitionManager`**, or **`FlyvaLink`**. API: [`@flyva/nuxt`](/api/nuxt) (see **`useDetachedRoot`**).

The Next adapter exposes the same helper with a React tree; see [Writing transitions (Next.js)](/guide/next/writing-transitions).
:::

### Re-querying the content element

The DOM changes between `leave` and `enter`. Prefer **`context.container`**, **`context.next`**, or **`context.current`** - the adapter sets them for each phase. Fall back to `document.querySelector(...)` only when you truly need a node outside the registered roots.

```ts
beforeEnter(context: PageTransitionContext) {
  this.content = context.container ?? context.next ?? null;
  if (this.content) this.content.style.opacity = '0';
}
```

### FLIP transition (expand a card)

Clone the trigger element in `prepare`, animate the clone to the target position in `leave`, then crossfade with the new page in `enter`:

```ts
async prepare(context: PageTransitionContext) {
  this.content = context.container ?? null;

  if (context.el instanceof HTMLElement) {
    const rect = context.el.getBoundingClientRect();
    this.clone = context.el.cloneNode(true) as HTMLElement;
    this.clone.classList.add('flyva-clone');
    Object.assign(this.clone.style, {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: '10000',
      margin: '0',
    });
    document.body.appendChild(this.clone);
  }
}

async leave() {
  if (!this.content || !this.clone) return;
  await Promise.all([
    animate(this.content, { opacity: 0, duration: 300 }),
    animate(this.clone, {
      top: '0px', left: '0px',
      width: '100vw', height: '300px',
      duration: 500, ease: 'inOutCubic',
    }),
  ]);
}

async enter(context: PageTransitionContext) {
  this.content = context.container ?? null;
  if (this.content) this.content.style.opacity = '0';

  await Promise.all([
    animate(this.clone, { opacity: 0, duration: 200 }),
    this.content ? animate(this.content, { opacity: 1, duration: 200 }) : Promise.resolve(),
  ]);
  this.clone?.remove();
}
```

See also the [Ref Stack](/guide/nuxt/ref-stack) guide for accessing element refs across page boundaries.

## Tips

- Keep `cleanup()` thorough - null out all references and remove inline styles
- `prepare()` is called before `leave()` and is awaited. Use it for heavy setup like cloning elements or measuring rects.
- The same transition instance is reused across navigations. Don't store state that leaks between runs - that's what `cleanup()` is for.
