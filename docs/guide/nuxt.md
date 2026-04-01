# Nuxt

This guide walks through setting up Flyva in a Nuxt 3 project. The Nuxt adapter works as a module — transitions are auto-discovered from a directory and composables are auto-imported.

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
| `defaultKey` | `string` | `'defaultTransition'` | Transition key used when none is specified on a link |
| `transitionsDir` | `string` | `'flyva-transitions'` | Directory containing transition files (relative to project root) |
| `useNamedExports` | `boolean` | `true` | Use named exports from transition files as individual transitions |

### 2. Write a transition

Place your transition files in the directory set by `transitionsDir`. The module auto-discovers every file and registers each **named export** as a transition.

```ts
// page-transitions/defaultTransition.ts
import { animate } from 'animejs';
import type { PageTransition } from '@flyva/shared';

class DefaultTransitionClass implements PageTransition {
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

export const defaultTransition = new DefaultTransitionClass();
```

The file name doesn't matter — the **export name** (`defaultTransition`) becomes the transition key.

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

Under the hood, `FlyvaPage` wraps `NuxtPage` with Vue's `<Transition>` and hooks into Nuxt's page lifecycle (`page:loading:start`, `page:start`, `page:finish`) to orchestrate the animation.

### 4. Mark the content container

In your layout, add `data-flyva-content` to the element your transitions will animate:

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

### 5. Use FlyvaLink

`FlyvaLink` wraps `NuxtLink` and is auto-imported — no explicit import needed.

```vue
<template>
  <FlyvaLink to="/about">About</FlyvaLink>
</template>
```

## Choosing a transition per link

Override the default transition for a specific link:

```vue
<FlyvaLink to="/work" flyva-transition="slideTransition">Work</FlyvaLink>
```

## Passing options to transitions

Pass arbitrary data via `:flyva-options`. It lands on `context.options` inside every lifecycle hook:

```vue
<FlyvaLink to="/work" :flyva-options="{ direction: 'left' }">
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

`:flyva-options` also accepts a function `() => PageTransitionOptions`.

## Auto-imported composables

The module registers these composables as auto-imports — use them anywhere in Vue components without an import statement:

| Composable | Returns |
|------------|---------|
| `useFlyvaTransition()` | `{ prepare, isRunning, stage, hasTransitioned }` |
| `useRefStack(key, ref)` | Registers a Vue ref in the global stack |
| `globalGetRefStackItem(key)` | Gets a ref by key |
| `globalGetRefStack()` | Gets the entire stack |

## Complete example

A minimal Nuxt app with a fade transition:

```ts
// page-transitions/defaultTransition.ts
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

export const defaultTransition = new Fade();
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
    <main data-flyva-content>
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
