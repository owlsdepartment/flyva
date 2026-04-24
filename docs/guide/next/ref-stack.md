# Ref Stack (Next.js)

The ref stack is a global registry for DOM element refs. It lets you access elements from one page inside transition code that runs between pages - the key ingredient for shared element / FLIP transitions.

## The problem

During a page transition, you often need to know the position or size of an element on the **outgoing** page (e.g. a card the user clicked) and the corresponding element on the **incoming** page (e.g. a hero image). But by the time the new page mounts, the old page's DOM is gone.

## The solution

`useRefStack` registers a ref under a string key in a global `Map`. Transition code can read that ref at any point during the lifecycle - even between page mounts - via `globalGetRefStackItem`.

## Registering a ref

```tsx
import { useRef } from 'react';
import { useRefStack } from '@flyva/next';

function HeroBlock() {
  const hero = useRef<HTMLDivElement>(null);
  useRefStack('hero', hero);

  return <div ref={hero} className="hero">...</div>;
}
```

## Reading refs from transitions

Use `globalGetRefStackItem` inside your transition code:

```ts
import { globalGetRefStackItem } from '@flyva/next';

class FadeWithHero implements PageTransition {
  async leave() {
    const hero = globalGetRefStackItem<HTMLElement>('hero');

    if (hero?.current) {
      await animate(hero.current, { scale: 0.95, opacity: 0, duration: 300 });
    }
    // ...
  }
}
```

::: tip Vue / Nuxt
Vue refs use **`.value`** instead of **`.current`**, and the outgoing page can clear template refs before async leave finishes — **`useFlyvaStickyRef()`** exists on Nuxt for that. See [Ref Stack (Nuxt)](/guide/nuxt/ref-stack).
:::

## Lifecycle & cleanup

`useRefStack` registers the ref on mount and removes it on unmount via `useEffect`. The ref stays available during the leave animation because React doesn't unmount the outgoing page until after the transition completes.

## Detached roots (overlays)

For UI that must exist **outside** the page tree but still use framework refs (e.g. a portal overlay during a transition), use `useDetachedRoot` from `@flyva/next`. It mounts a temporary root on `document.body` and returns `{ refs, waitForRender, destroy }`. Call `destroy()` in your transition’s `cleanup()` or `afterEnter()`.

## API summary

| Function | Description |
|----------|-------------|
| `useRefStack(key, ref)` | Register a ref in the global stack. Cleaned up automatically on unmount. |
| `globalGetRefStackItem<T>(key)` | Get a single ref by key. Returns `RefObject<T>` or `undefined`. |
| `globalGetRefStack()` | Get the entire stack as a plain object. |
