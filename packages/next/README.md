# @flyva/next

Next.js (App Router) adapter for flyva page transitions.

## Install

```bash
pnpm add @flyva/next @flyva/shared
```

Add both packages to `transpilePackages` in your Next config:

```ts
// next.config.ts
export default {
  transpilePackages: ['@flyva/next', '@flyva/shared'],
};
```

## Setup

### 1. Write a transition

```ts
// src/page-transitions/fadeTransition.ts
import { animate } from 'animejs';
import type { PageTransition } from '@flyva/shared';

class FadeTransitionClass implements PageTransition {
  private content: HTMLElement | null = null;

  async prepare() {
    this.content = document.querySelector('[data-flyva-content]');
  }

  async leave() {
    if (!this.content) return;
    await animate(this.content, { opacity: 0, duration: 400 });
  }

  beforeEnter() {
    this.content = document.querySelector('[data-flyva-content]');
    if (this.content) this.content.style.opacity = '0';
  }

  async enter() {
    if (!this.content) return;
    await animate(this.content, { opacity: 1, duration: 400 });
  }

  cleanup() { this.content = null; }
}

export const fadeTransition = new FadeTransitionClass();
```

### 2. Create a client provider

Transition instances are classes — they can't be passed from Server Components. Create a client component:

```tsx
// src/components/FlyvaProvider.tsx
'use client';

import { FlyvaRoot } from '@flyva/next';
import { fadeTransition } from '@/page-transitions/fadeTransition';

const transitions = { fadeTransition };

export function FlyvaProvider({ children }) {
  return <FlyvaRoot transitions={transitions}>{children}</FlyvaRoot>;
}
```

### 3. Wrap your layout

```tsx
// src/app/layout.tsx
import { FlyvaProvider } from '@/components/FlyvaProvider';

export default function RootLayout({ children }) {
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

The `data-flyva-content` attribute marks the element transitions animate.

### 4. Use FlyvaLink

```tsx
import { FlyvaLink } from '@flyva/next';

<FlyvaLink href="/about">About</FlyvaLink>

// Override the default transition
<FlyvaLink href="/work" flyvaTransition="slideTransition">Work</FlyvaLink>

// Pass options to the transition
<FlyvaLink href="/work" flyvaOptions={{ direction: 'left' }}>Back</FlyvaLink>
```

## API

| Export | Description |
|--------|-------------|
| `FlyvaRoot` | Provider component — accepts `transitions` map and optional `config` |
| `FlyvaLink` | Drop-in replacement for Next.js `Link` with transition support |
| `useFlyvaTransition()` | Hook returning `{ prepare, leave, enter, hasTransitioned }` |
| `useFlyvaConfig()` | Access the current flyva config |
| `useFlyvaManager()` | Access the `PageTransitionManager` instance |
| `useRefStack(key, ref)` | Register a React ref in the global ref stack |
| `globalGetRefStackItem(key)` | Retrieve a ref from the stack (for use in transitions) |
