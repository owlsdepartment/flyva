# @flyva/nuxt

Nuxt 3 module for flyva page transitions.

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

### 2. Write a transition

Place transition files in the directory specified by `transitionsDir` (default: `page-transitions/`). The module auto-discovers and registers them.

```ts
// page-transitions/defaultTransition.ts
import { animate } from 'animejs';
import { defineTransition } from '@flyva/shared';

export const defaultTransition = defineTransition({
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

### 3. Add FlyvaPage to your app

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <FlyvaPage />
  </NuxtLayout>
</template>
```

`FlyvaPage` registers outgoing and incoming page roots — use `context.container` in transition hooks instead of querying the document.

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

### 4. Use FlyvaLink

```vue
<FlyvaLink to="/about">About</FlyvaLink>

<!-- Override the default transition -->
<FlyvaLink to="/work" flyva-transition="slideTransition">Work</FlyvaLink>

<!-- Pass options -->
<FlyvaLink to="/work" :flyva-options="{ direction: 'left' }">Back</FlyvaLink>
```

## Module options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultKey` | `string` | `'defaultTransition'` | Key of the transition used when none is specified |
| `transitionsDir` | `string` | `'flyva-transitions'` | Directory containing transition files |
| `useNamedExports` | `boolean` | `true` | Use named exports from transition files |

## Auto-imported composables

The module auto-imports these — no explicit import needed in Vue files:

| Composable | Description |
|------------|-------------|
| `useFlyvaTransition()` | Returns `{ prepare, isRunning, stage, hasTransitioned }` |
| `useRefStack(key, ref)` | Register a Vue ref in the global ref stack |
| `globalGetRefStackItem(key)` | Retrieve a ref from the stack |
| `globalGetRefStack()` | Get the entire ref stack as an object |
