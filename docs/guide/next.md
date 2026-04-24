# Next.js

This guide walks through setting up Flyva in a Next.js App Router project, from install to your first animated page transition.

## Install

```bash
pnpm add @flyva/next @flyva/shared
```

Add both packages to `transpilePackages` so Next can compile the TypeScript sources:

```ts
// next.config.ts
export default {
  transpilePackages: ['@flyva/next', '@flyva/shared'],
};
```

## Setup

### 1. Write a transition

A transition is a class implementing the `PageTransition` interface. Use any animation library you like.

```ts
// src/page-transitions/fadeTransition.ts
import { animate } from 'animejs';
import type { PageTransition } from '@flyva/shared';

class FadeTransitionClass implements PageTransition {
  private content: HTMLElement | null = null;

  async prepare() {
    this.content = document.querySelector('[data-flyva-content]');
  }

  beforeLeave() {
    if (!this.content) return;
    document.body.classList.add('flyva-transition-active');
    this.content.style.pointerEvents = 'none';
  }

  async leave() {
    if (!this.content) return;
    await animate(this.content, { opacity: 0, duration: 400, ease: 'inQuad' });
  }

  afterLeave() {
    if (!this.content) return;
    this.content.style.pointerEvents = '';
  }

  beforeEnter() {
    this.content = document.querySelector('[data-flyva-content]');
    if (this.content) this.content.style.opacity = '0';
  }

  async enter() {
    if (!this.content) return;
    await animate(this.content, { opacity: 1, duration: 400, ease: 'outQuad' });
  }

  afterEnter() {
    document.body.classList.remove('flyva-transition-active');
  }

  cleanup() {
    this.content = null;
  }
}

export const fadeTransition = new FadeTransitionClass();
```

Export an **instance**, not the class. The same instance is reused across navigations — `cleanup()` resets it between runs.

### 2. Create a client provider

Transition instances are classes and can't cross the Server → Client Component boundary in Next.js. Wrap `FlyvaRoot` in a dedicated `'use client'` component:

```tsx
// src/components/FlyvaProvider.tsx
'use client';

import { FlyvaRoot } from '@flyva/next';
import { PropsWithChildren } from 'react';
import { fadeTransition } from '@/page-transitions/fadeTransition';

const transitions = { fadeTransition };

export function FlyvaProvider({ children }: PropsWithChildren) {
  return <FlyvaRoot transitions={transitions}>{children}</FlyvaRoot>;
}
```

The keys in the `transitions` object are the names you'll reference from `FlyvaLink`.

### 3. Wrap your layout

```tsx
// src/app/layout.tsx
import { FlyvaProvider } from '@/components/FlyvaProvider';
import { FlyvaTransitionWrapper } from '@flyva/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FlyvaProvider>
          <nav>...</nav>
          <main data-flyva-content>
            <FlyvaTransitionWrapper>{children}</FlyvaTransitionWrapper>
          </main>
        </FlyvaProvider>
      </body>
    </html>
  );
}
```

Put `FlyvaTransitionWrapper` around the segment that should swap on navigation. It owns the content ref the manager uses for **concurrent** transitions, **CSS-mode** class staging, and **View Transitions** handoff. Keep `data-flyva-content` on an outer element if you still query it in `prepare()`; align what you animate with the subtree inside the wrapper when using those modes.

### 4. Use FlyvaLink

`FlyvaLink` is a drop-in replacement for Next.js `Link`. It intercepts clicks, runs the leave animation, then pushes the route.

```tsx
import { FlyvaLink } from '@flyva/next';

<FlyvaLink href="/about">About</FlyvaLink>
```

## Choosing a transition per link

By default, every `FlyvaLink` uses the transition named by `config.defaultKey` (defaults to `'defaultTransition'`). Override it with the `flyvaTransition` prop:

```tsx
<FlyvaLink href="/work" flyvaTransition="slideTransition">Work</FlyvaLink>
```

## Passing options to transitions

Pass arbitrary data to your transition via `flyvaOptions`. The data lands on `context.options` inside every lifecycle hook:

```tsx
<FlyvaLink href="/work" flyvaOptions={{ direction: 'left' }}>
  Back to work
</FlyvaLink>
```

```ts
// Inside your transition
async leave(context) {
  const dir = context.options.direction === 'left' ? '100%' : '-100%';
  await animate(this.content, { translateX: dir, duration: 500 });
}
```

`flyvaOptions` also accepts a function `() => PageTransitionOptions` if you need to compute values at click time.

## Config

`FlyvaRoot` accepts an optional `config` prop:

```tsx
<FlyvaRoot
  transitions={transitions}
  config={{ defaultKey: 'fadeTransition', viewTransition: true }}
>
```

| Option | Type | Default |
|--------|------|---------|
| `defaultKey` | `string` | `'defaultTransition'` |
| `viewTransition` | `boolean` | `undefined` |
| `lifecycleClassPrefix` | `string` | `'flyva'` |

`lifecycleClassPrefix` controls the CSS class prefix on `<html>` (e.g. `flyva-running`, `flyva-leave-active`). `data-flyva-transition` on `<html>` always reflects the active transition key. See [Lifecycle classes](/guide/modes/lifecycle).

When `viewTransition` is `true`, `FlyvaLink` uses `document.startViewTransition` for the navigation. Your transition can set `viewTransitionNames` and/or `animateViewTransition` (see [View Transitions mode](./modes/view-transitions)). Unsupported browsers log a dev warning; provide a non–View-Transition fallback if you need one.

## Navigation timing

- **Default** — `leave()` is awaited, then `router.push` runs (sequential).
- **`concurrent: true` on the transition** — `leave()` is started without awaiting, navigation runs immediately; a short-lived clone covers the outgoing DOM until the swap. Use `context.current` / `context.next` in hooks.
- **`viewTransition: true` in config** — navigation runs inside `startViewTransition`; DOM swap is coordinated via `leaveWithViewTransition` internally.

### Concurrent mode and content cloning

::: warning Fragile on the App Router
Overlapping leave and navigation on **Next.js** is only possible because Flyva **injects a DOM clone** of the swap subtree before `router.push`. The App Router does not keep two full React trees mounted the way Nuxt’s page `<Transition>` can—cloning is the workaround.

That has real downsides you should plan for:

- **Layout shift** — the clone and the live layout can disagree (scroll position, responsive breakpoints, fonts still loading, etc.).
- **Animations replaying** — CSS animations or transitions may **run again** on the clone (`cloneNode` does not preserve every runtime animation state the way a live subtree does).
- **Refs and identity** — React **refs and component state** still point at the **original** nodes; the element you animate during leave is often the **clone**, not the tree your components mounted. Anything that assumed “this ref is the page” can be wrong until `enter` runs on the new route.

You need to **validate** hover/focus, media, third-party widgets, and imperative APIs yourself, or accept occasional visual glitches. For a **native** old→new handoff without this cloning model, use **[View Transitions mode](./modes/view-transitions)** (`config.viewTransition: true`) instead—`concurrent` is not used on that path.
:::

## FlyvaLink bypass mode

`FlyvaLink` accepts a `flyva` prop (default `true`). Set it to `false` to render a standard `next/link` with no transition interception. This lets you use `FlyvaLink` as a project-wide `Link` replacement while opting out for specific links:

```tsx
import { FlyvaLink } from '@flyva/next';

<FlyvaLink href="/about">About</FlyvaLink>               {/* transition */}
<FlyvaLink href="/terms" flyva={false}>Terms</FlyvaLink>   {/* plain navigation */}
```

## Reacting to lifecycle events

### From any component: `useFlyvaLifecycle`

`useFlyvaLifecycle` lets any component inside `FlyvaRoot` react to transition lifecycle stages. It **always** registers with `PageTransitionManager` as an active hook. With **`blocking: false`** (default), `prepare` / `leave` / `enter` do not hold up the manager (returned promises are not awaited); with **`blocking: true`**, those three steps await your work like the transition’s own hooks.

**Non-blocking mode** (default, `blocking: false`) — boundary hooks are synchronous; `prepare` / `leave` / `enter` run without delaying the transition:

```tsx
'use client';
import { useFlyvaLifecycle } from '@flyva/next';

function Analytics() {
  useFlyvaLifecycle({
    beforeLeave(ctx) { trackPageLeave(ctx.name); },
    afterEnter(ctx)  { trackPageEnter(ctx.name); },
  });
  return null;
}
```

**Blocking mode** (`blocking: true`) — `prepare`, `leave`, and `enter` are awaited in parallel with the transition’s own hooks (`Promise.all` per stage). Use when a component must finish its own animation before that step completes:

```tsx
'use client';
import { useFlyvaLifecycle } from '@flyva/next';

function ProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useFlyvaLifecycle({
    async leave() {
      if (barRef.current) {
        await animate(barRef.current, { scaleX: 1, duration: 400 });
      }
    },
  }, { blocking: true });

  return <div ref={barRef} className="progress-bar" />;
}
```

If the component unmounts mid-transition, the hook unregisters automatically and resolves its outstanding promises so the transition is never blocked.

### From FlyvaLink: callback props

`FlyvaLink` exposes lifecycle callback props with the same delivery as non-blocking `useFlyvaLifecycle` (`onPrepare` / `onLeave` / `onEnter` do not block navigation):

```tsx
<FlyvaLink
  href="/about"
  onBeforeLeave={() => setLoading(true)}
  onAfterEnter={() => setLoading(false)}
>
  About
</FlyvaLink>
```

See the [API reference](/api/next#flyvalink) for the full list of callback props.

## Complete example

Putting it all together — a minimal Next.js app with a fade transition:

```tsx
// src/page-transitions/fadeTransition.ts
import { animate } from 'animejs';
import type { PageTransition } from '@flyva/shared';

class Fade implements PageTransition {
  private el: HTMLElement | null = null;

  async prepare() { this.el = document.querySelector('[data-flyva-content]'); }
  async leave()   { if (this.el) await animate(this.el, { opacity: 0, duration: 300 }); }
  beforeEnter()   { this.el = document.querySelector('[data-flyva-content]'); if (this.el) this.el.style.opacity = '0'; }
  async enter()   { if (this.el) await animate(this.el, { opacity: 1, duration: 300 }); }
  cleanup()       { this.el = null; }
}

export const fadeTransition = new Fade();
```

```tsx
// src/components/FlyvaProvider.tsx
'use client';
import { FlyvaRoot } from '@flyva/next';
import { fadeTransition } from '@/page-transitions/fadeTransition';

const transitions = { fadeTransition };

export function FlyvaProvider({ children }: React.PropsWithChildren) {
  return <FlyvaRoot transitions={transitions}>{children}</FlyvaRoot>;
}
```

```tsx
// src/app/layout.tsx
import { FlyvaProvider } from '@/components/FlyvaProvider';
import { FlyvaTransitionWrapper } from '@flyva/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FlyvaProvider>
          <main data-flyva-content>
            <FlyvaTransitionWrapper>{children}</FlyvaTransitionWrapper>
          </main>
        </FlyvaProvider>
      </body>
    </html>
  );
}
```

```tsx
// src/app/page.tsx
import { FlyvaLink } from '@flyva/next';

export default function Home() {
  return <FlyvaLink href="/about">Go to About</FlyvaLink>;
}
```
