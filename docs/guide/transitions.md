# Writing Transitions

Flyva doesn't ship any built-in animations. You implement transitions yourself using whatever animation library fits your project. This page explains the interface, the recommended patterns, and a few recipes.

## The interface

A transition is any object that implements (some of) these hooks:

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

All hooks are optional. A transition that only defines `leave` and `enter` is perfectly valid.

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

## Recipes

### Overlay during transition

Use `beforeLeave` / `afterEnter` to toggle a class that shows an overlay or disables interactions:

```ts
beforeLeave() {
  document.body.classList.add('flyva-transition-active');
  if (this.content) this.content.style.pointerEvents = 'none';
}

afterEnter() {
  document.body.classList.remove('flyva-transition-active');
}
```

```css
body.flyva-transition-active::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: auto;
}
```

### Re-querying the content element

The DOM changes between `leave` and `enter` — the old page is unmounted, the new page is mounted. Always re-query `[data-flyva-content]` in `beforeEnter`:

```ts
beforeEnter() {
  this.content = document.querySelector('[data-flyva-content]');
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
