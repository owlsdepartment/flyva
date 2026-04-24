# Nuxt

This guide walks through setting up Flyva in a Nuxt 4 project. The Nuxt adapter works as a module - transitions are auto-discovered from a directory and composables are auto-imported.

## Install

```bash
pnpm add @flyva/nuxt @flyva/shared
```

## Setup

### 1. Register the module

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@flyva/nuxt'],
  flyva: {
    defaultKey: 'defaultTransition',
    transitionsDir: 'page-transitions',
  },
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultKey` | `string` | `'defaultTransition'` | Fallback map key when no `condition` matches and the link has no `flyva-transition` |
| `transitionsDir` | `string` | `'flyva-transitions'` | Directory containing transition files (relative to project root) |
| `useNamedExports` | `boolean` | `true` | Use named exports from transition files as individual transitions |
| `viewTransition` | `boolean` | `undefined` | When `true`, `FlyvaLink` wraps navigation in `document.startViewTransition` (see [View Transition API](/guide/nuxt/view-transition-api)) |

If you enable Nuxt’s built-in `app.viewTransition` and Flyva’s `flyva.viewTransition` at the same time, the module logs a warning - turn off Nuxt’s global View Transitions and let Flyva drive them, or keep only one system.

### 2. Write a transition

Place your transition files in the directory set by `transitionsDir`. The module auto-discovers every file and registers each **named export** as a transition.

```ts
// page-transitions/defaultTransition.ts
import { animate } from 'animejs';
import { defineTransition } from '@flyva/shared';

export const defaultTransition = defineTransition({
  beforeLeave(ctx) {
    const el = ctx.container;
    if (!el) return;
    el.style.pointerEvents = 'none';
  },

  async leave(ctx) {
    const el = ctx.container;
    if (!el) return;
    await animate(el, { opacity: 0, duration: 400, ease: 'inQuad' });
  },

  afterLeave(ctx) {
    const el = ctx.container;
    if (!el) return;
    el.style.pointerEvents = '';
  },

  beforeEnter(ctx) {
    const el = ctx.container;
    if (!el) return;
    el.style.opacity = '0';
  },

  async enter(ctx) {
    const el = ctx.container;
    if (!el) return;
    await animate(el, { opacity: 1, duration: 400, ease: 'outQuad' });
  },
});
```

The file name doesn't matter - the **export name** (`defaultTransition`) becomes the transition key. Because the generated map’s key order follows file discovery, use optional **`priority`** on a transition when **`condition`**-based matching must run in a specific order (see [Writing transitions](/guide/nuxt/writing-transitions#transition-resolution)).

### 3. Add FlyvaPage

Replace `<NuxtPage />` with `<FlyvaPage />` in your `app.vue`:

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <FlyvaPage />
  </NuxtLayout>
</template>
```

Under the hood, `FlyvaPage` wraps `NuxtPage` with Vue's `<Transition>` (`css: false`) and hooks into Nuxt's page lifecycle. It registers **outgoing and incoming page roots** with the manager, so transition hooks receive [`PageTransitionContext`](/api/shared#pagetransitioncontext) (`container`, `current`, `next`) the same way as on Next - you normally animate those nodes rather than querying the document. It branches on the active transition: **sequential** (default `out-in`), **`concurrent: true`** (leave can overlap navigation; enter runs after the new page is ready), **`cssMode: true`** (class-based phases via `@flyva/shared`), and **`viewTransition`** when enabled in config (coordinates with `FlyvaLink`’s `startViewTransition` callback).

Use **[FlyvaLink](/guide/nuxt/flyva-link)** for navigations and **[Hooks](/guide/nuxt/hooks)** for composables (`useFlyvaLifecycle`, `useFlyvaStickyRef`, and others). **[View Transition API](/guide/nuxt/view-transition-api)** covers `flyva.viewTransition` and transition-object VT fields.

## Complete example

A minimal Nuxt app with a fade transition:

```ts
// page-transitions/defaultTransition.ts
import { animate } from 'animejs';
import { defineTransition } from '@flyva/shared';

export const defaultTransition = defineTransition({
  async leave(ctx) {
    const el = ctx.container;
    if (!el) return;
    await animate(el, { opacity: 0, duration: 300 });
  },
  beforeEnter(ctx) {
    const el = ctx.container;
    if (!el) return;
    el.style.opacity = '0';
  },
  async enter(ctx) {
    const el = ctx.container;
    if (!el) return;
    await animate(el, { opacity: 1, duration: 300 });
  },
});
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@flyva/nuxt'],
  flyva: {
    transitionsDir: 'page-transitions',
  },
});
```

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <FlyvaPage />
  </NuxtLayout>
</template>
```

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <nav>...</nav>
    <main>
      <slot />
    </main>
  </div>
</template>
```

```vue
<!-- pages/index.vue -->
<template>
  <div>
    <h1>Home</h1>
    <FlyvaLink to="/about">Go to About</FlyvaLink>
  </div>
</template>
```
