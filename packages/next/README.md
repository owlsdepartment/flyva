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
import { defineTransition } from '@flyva/shared';

export const fadeTransition = defineTransition({
  async leave(ctx) {
    const el = ctx.container;
    if (!el) return;
    await animate(el, { opacity: 0, duration: 400 });
  },
  beforeEnter(ctx) {
    const el = ctx.container;
    if (!el) return;
    el.style.opacity = '0';
  },
  async enter(ctx) {
    const el = ctx.container;
    if (!el) return;
    await animate(el, { opacity: 1, duration: 400 });
  },
});
```

### 2. Create a client provider

Nuxt’s module plugin and runtime config cover Flyva setup; in Next you typically use a small client provider as the entrypoint. Transitions use browser APIs, so mount `FlyvaRoot` in a `'use client'` component. Pass `transitions` and, if you need it, optional `config` (see [`docs/api/next.md`](../../docs/api/next.md#flyvaroot)).

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
import { FlyvaTransitionWrapper } from '@flyva/next';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <FlyvaProvider>
          <main>
            <FlyvaTransitionWrapper>{children}</FlyvaTransitionWrapper>
          </main>
        </FlyvaProvider>
      </body>
    </html>
  );
}
```

`FlyvaTransitionWrapper` registers the swapping subtree with the manager so hooks receive `context.container` / `current` / `next`.

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
