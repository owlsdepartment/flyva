# Writing transitions

Flyva doesn't ship any built-in animations. This page covers the **JS hook** style: lifecycle, patterns, and recipes. For **CSS-driven** or **View Transitions** setups, start at [Transition modes](/guide/modes/).

You implement transitions using whatever animation library fits your project (anime.js, GSAP, Motion, etc.). The sections below focus on the shared interface and common patterns.

## The interface

A transition is any object that implements (some of) these hooks:

```ts
interface PageTransition {
  concurrent?: boolean;
  cssMode?: boolean;
  viewTransitionNames?: Record<string, string> | ((ctx) => Record<string, string>);
  animateViewTransition?(vt: ViewTransition, context): Promise<void>;
  condition?(context): boolean | Promise<boolean>;
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
| `concurrent` | Outgoing and incoming content can overlap. On **Next.js**, a frozen clone is inserted before navigation so the old view does not flash empty; **Nuxt** overlaps via `FlyvaPage` / Vue `<Transition>`. `context.current` / `context.next` point at the roots being handed off. Ignored when [View Transitions mode](/guide/modes/view-transitions) is on. |

::: warning Next.js `concurrent` and cloning
On the **App Router**, `concurrent` depends on **content cloning** (App Router constraints). Expect possible **layout shifts**, **CSS animations or transitions replaying** on the clone, and **loss of useful React refs** on the node being animated (the clone is not your mounted tree). Design around `context.current` / `context.next`, test edge cases, or switch to [View Transitions](/guide/modes/view-transitions) for a native handoff. Details: [Next.js — concurrent mode and content cloning](/guide/next#concurrent-mode-and-content-cloning).
:::

| `cssMode` | Animation via generated CSS classes instead of `leave`/`enter`. See [CSS mode](/guide/modes/css-mode). |
| `viewTransitionNames` | Used with app-level View Transitions. See [View Transitions mode](/guide/modes/view-transitions). |
| `animateViewTransition` | Optional hook after `vt.ready` when using View Transitions. See [View Transitions mode](/guide/modes/view-transitions). |

`condition` can return `false` to skip running this transition (same frame as `prepare`).

## Transition resolution

When a user clicks a `FlyvaLink`, the framework adapter decides which transition to run:

1. If the link has `flyvaTransition` / `flyva-transition` set, that key is used
2. Otherwise, the `defaultKey` from config is used (defaults to `'defaultTransition'`)

The key must match a transition registered in the transition map (Next.js) or auto-discovered from the transitions directory (Nuxt).

## Class-based pattern

The recommended approach is a class with instance properties for caching DOM references. Export a singleton instance — it gets reused across navigations and `cleanup()` resets it.

```ts
import { animate } from 'animejs';
import type { PageTransition, PageTransitionContext } from '@flyva/shared';

class SlideTransitionClass implements PageTransition {
  private content: HTMLElement | null = null;

  async prepare() {
    this.content = document.querySelector('[data-flyva-content]');
  }

  async leave(context: PageTransitionContext) {
    if (!this.content) return;
    const dir = context.options.direction === 'left' ? '100%' : '-100%';
    await animate(this.content, {
      translateX: dir,
      opacity: 0,
      duration: 500,
      ease: 'inOutCubic',
    });
  }

  beforeEnter(context: PageTransitionContext) {
    this.content = document.querySelector('[data-flyva-content]');
    if (!this.content) return;
    const dir = context.options.direction === 'left' ? '-100%' : '100%';
    this.content.style.transform = `translateX(${dir})`;
    this.content.style.opacity = '0';
  }

  async enter() {
    if (!this.content) return;
    await animate(this.content, {
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

## Using `context.current` and `context.next`

The manager tracks the outgoing and incoming content roots when the framework sets them (Next.js via `FlyvaTransitionWrapper`, Nuxt via `FlyvaPage`). During a transition, read:

- `context.current` — element that is leaving (or a stand-in clone in concurrent mode)
- `context.next` — element that is entering, once it exists

Prefer these over `querySelector('[data-flyva-content]')` when you need the exact subtree the adapter swaps, especially with `concurrent: true`.

## Using context.el

When a user clicks a `FlyvaLink`, `context.el` is set to the DOM element that was clicked. This is useful for shared element / FLIP transitions where you need to know the starting position of the trigger:

```ts
async prepare(context: PageTransitionContext) {
  this.content = document.querySelector('[data-flyva-content]');

  if (context.el) {
    const rect = context.el.getBoundingClientRect();
    this.snapshot = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    this.triggerEl = context.el as HTMLElement;
  }
}
```

## Using options

Pass per-link data via `flyvaOptions` (React) or `:flyva-options` (Vue):

::: code-group

```tsx [Next.js]
<FlyvaLink href="/work" flyvaOptions={{ direction: 'left', color: '#000' }}>
  Back
</FlyvaLink>
```

```vue [Nuxt]
<FlyvaLink to="/work" :flyva-options="{ direction: 'left', color: '#000' }">
  Back
</FlyvaLink>
```

:::

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
| `afterEnter` | — | `flyva-enter-active`, `flyva-enter-to` |
| `none` (finish) | — | all of the above + `data-flyva-transition` |

Use **`html.flyva-running`** for styles that should cover the **entire** swap (including the pending gap). Use **`html[data-flyva-transition="overlayTransition"]`** (or any key) to branch CSS per transition — for example hide a global progress bar when an overlay transition already provides its own chrome.

See the dedicated [Lifecycle classes](/guide/modes/lifecycle) page for diagrams and adapter-specific notes.

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

Alternatively, toggle classes manually in your transition hooks:

```ts
beforeLeave() {
  document.body.classList.add('flyva-transition-active');
  if (this.content) this.content.style.pointerEvents = 'none';
}

afterEnter() {
  document.body.classList.remove('flyva-transition-active');
}
```

### Re-querying the content element

The DOM changes between `leave` and `enter` — the old page is unmounted, the new page is mounted. In `beforeEnter` / `enter`, re-resolve the node you animate: either `context.next` when the adapter provides it, or `document.querySelector('[data-flyva-content]')` / your own selector.

```ts
beforeEnter(context: PageTransitionContext) {
  this.content = (context.next as HTMLElement) ?? document.querySelector('[data-flyva-content]');
  if (this.content) this.content.style.opacity = '0';
}
```

### FLIP transition (expand a card)

Clone the trigger element in `prepare`, animate the clone to the target position in `leave`, then crossfade with the new page in `enter`:

```ts
async prepare(context: PageTransitionContext) {
  this.content = document.querySelector('[data-flyva-content]');

  if (context.el) {
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
  await Promise.all([
    animate(this.content, { opacity: 0, duration: 300 }),
    animate(this.clone, {
      top: '0px', left: '0px',
      width: '100vw', height: '300px',
      duration: 500, ease: 'inOutCubic',
    }),
  ]);
}

async enter() {
  this.content = document.querySelector('[data-flyva-content]');
  if (this.content) this.content.style.opacity = '0';

  await Promise.all([
    animate(this.clone, { opacity: 0, duration: 200 }),
    animate(this.content, { opacity: 1, duration: 200 }),
  ]);
  this.clone?.remove();
}
```

See also the [Ref Stack](./ref-stack) guide for accessing element refs across page boundaries.

## Tips

- Keep `cleanup()` thorough — null out all references and remove inline styles
- `prepare()` is called before `leave()` and is awaited. Use it for heavy setup like cloning elements or measuring rects.
- The same transition instance is reused across navigations. Don't store state that leaks between runs — that's what `cleanup()` is for.
