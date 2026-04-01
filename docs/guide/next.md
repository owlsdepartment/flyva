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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FlyvaProvider>
          <nav>...</nav>
          <main data-flyva-content>{children}</main>
        </FlyvaProvider>
      </body>
    </html>
  );
}
```

The `data-flyva-content` attribute marks the wrapper your transitions will animate. Query it with `document.querySelector('[data-flyva-content]')` in your transition's `prepare()` hook.

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
<FlyvaRoot transitions={transitions} config={{ defaultKey: 'fadeTransition' }}>
```

| Option | Type | Default |
|--------|------|---------|
| `defaultKey` | `string` | `'defaultTransition'` |

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FlyvaProvider>
          <main data-flyva-content>{children}</main>
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
