# Ref Stack (Nuxt)

The ref stack is a global registry for DOM element refs. It lets you access elements from one page inside transition code that runs between pages - the key ingredient for shared element / FLIP transitions.

## The problem

During a page transition, you often need to know the position or size of an element on the **outgoing** page (e.g. a card the user clicked) and the corresponding element on the **incoming** page (e.g. a hero image). But by the time the new page mounts, the old page's DOM is gone.

## The solution

`useRefStack` registers a ref under a string key in a global `Map`. Transition code can read that ref at any point during the lifecycle - even between page mounts - via `globalGetRefStackItem`.

## Registering a ref

```vue
<script setup>
const hero = ref(null);
useRefStack('hero', hero);
</script>

<template>
  <div ref="hero" class="hero">...</div>
</template>
```

In Nuxt, both `useRefStack` and `ref` are auto-imported.

## Reading refs from transitions

Use `globalGetRefStackItem` inside your transition code:

```ts
import { globalGetRefStackItem } from '@flyva/nuxt/composables';

class FadeWithHero implements PageTransition {
  async leave() {
    const hero = globalGetRefStackItem<HTMLElement>('hero');

    if (hero?.value) {
      await animate(hero.value, { scale: 0.95, opacity: 0, duration: 300 });
    }
    // ...
  }
}
```

::: tip React / Next.js
React refs use **`.current`** instead of **`.value`**. On Next, the outgoing tree typically stays mounted until leave completes — different from Vue’s ref timing. See [Ref Stack (Next.js)](/guide/next/ref-stack).
:::

## Lifecycle & cleanup

`useRefStack` cleans up in `onUnmounted` (not `onScopeDispose`). This is deliberate - `onUnmounted` fires after Vue's `<Transition>` `onLeave` callback completes, so the ref remains in the stack for the entire leave animation.

## Detached roots (overlays)

For UI that must exist **outside** the page tree but still use framework refs (e.g. a portal overlay during a transition), use `useDetachedRoot` from `@flyva/nuxt` (auto-imported). It mounts a temporary app on `document.body` and returns `{ refs, waitForRender, destroy }`. Call `destroy()` in your transition’s `cleanup()` or `afterEnter()`.

## API summary

| Function | Description |
|----------|-------------|
| `useRefStack(key, ref)` | Register a ref in the global stack. Cleaned up automatically on unmount. |
| `globalGetRefStackItem<T>(key)` | Get a single ref by key. Returns `Ref<T>` or `undefined`. |
| `globalGetRefStack()` | Get the entire stack as a plain object. |
