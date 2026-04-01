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
import type { PageTransition } from '@flyva/shared';

class DefaultTransitionClass implements PageTransition {
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

export const defaultTransition = new DefaultTransitionClass();
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

Mark your content wrapper with `data-flyva-content` in the layout:

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <nav>...</nav>
    <main data-flyva-content>
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
