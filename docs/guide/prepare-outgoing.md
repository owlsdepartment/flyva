# prepareOutgoing (Next.js concurrent)

`prepareOutgoing` is a **Next.js** hook for reshaping an outgoing **clone** before leave. It runs after `prepare` and **before** the clone is inserted (concurrent link swaps, and history [`snapshot`](/guide/next/history)).

Nuxt concurrent overlap keeps the live outgoing page mounted - there is no clone to fix, so this API is not part of the Nuxt surface. Prefer `prepare` / `beforeLeave` / `leave` there.

## Why it exists

On the **App Router**, `concurrent: true` deep-clones the swap subtree so leave can run while `router.push` commits. A raw `cloneNode(true)` is incomplete:

- `<video>` frames and `<canvas>` pixels are blank
- CSS animations restart (and Next pauses them on `.flyva-clone`, often freezing finished entrance animations at their start state)

Hooks that run only in `beforeLeave` see the clone **after** it is already on screen. `prepareOutgoing` runs **before** the clone is inserted (and before the live source is hidden), so you can fix media and animation state without a broken first frame.

## When it runs

Order for concurrent navigations on Next:

1. Transition + active-hook `prepare` (as usual)
2. Adapter builds the outgoing clone
3. **`prepareOutgoing`** (global → component → transition), **awaited sequentially**
4. Adapter inserts the clone and hides the live source
5. `beforeLeave` → `leave` → …

Non-concurrent transitions never call these hooks (dev warns if a transition defines `prepareOutgoing` without `concurrent: true`).

## Three registration levels

### 1. Global (`FlyvaRoot` config)

```tsx
import { FlyvaRoot } from '@flyva/next';
import { freezeAnimations, freezeMedia } from '@flyva/shared';

<FlyvaRoot
  transitions={transitions}
  config={{
    prepareOutgoing: [freezeMedia(), freezeAnimations()],
  }}
>
```

You can also call `useFlyvaManager().onPrepareOutgoing(hook)` (returns unregister).

### 2. Component (`useFlyvaLifecycle`)

```ts
useFlyvaLifecycle({
  prepareOutgoing(ctx) {
    // reshape ctx.target using ctx.source / counterpart / pairs
  },
});
```

`prepareOutgoing` on active hooks is **always awaited**, regardless of `blocking`. Reshaping after insertion would defeat the purpose.

### 3. Transition

```ts
export const slide = defineTransition({
  concurrent: true,
  prepareOutgoing(ctx) {
    // transition-specific outgoing work
  },
});
```

Runs after global and component hooks.

### `isolateOutgoing`

Set `isolateOutgoing: true` on a transition to **skip** global and component outgoing hooks and run only that transition’s `prepareOutgoing`.

## OutgoingContext

Extends [`PageTransitionContext`](/api/shared#pagetransitioncontext):

| Field | Description |
|-------|-------------|
| `source` | Live outgoing content root |
| `target` | Clone that will play leave (`current` / `container` are set to it) |
| `isClone` | `true` for the Next clone path |
| `counterpart(live)` | Maps an element in `source` to its copy in `target` |
| `pairs(selector)` | `[live, target][]` for matching nodes |

Counterparts are mapped **eagerly** when the context is created, so the map stays valid after hooks mutate the clone.

## Built-in helpers

Import from `@flyva/shared` or `@flyva/shared/outgoing`. Both no-op when `!isClone`.

| Helper | Role |
|--------|------|
| `freezeAnimations()` | Offset running CSS animations with a negative delay; finished animations get `animation-name: none` so the paused clone keeps the end frame. Scroll-driven timelines are left alone. Relies on Next’s `.flyva-clone` pause CSS. |
| `freezeMedia(options?)` | Replaces matching `video` / `canvas` nodes in the clone with canvases painted from the live counterparts. |

```ts
import { freezeAnimations, freezeMedia } from '@flyva/shared';

freezeMedia({
  selector: 'video, canvas',
  inViewport: true,
  styleProps: ['width', 'height', 'object-fit', 'opacity'],
});
```

## Aborting a concurrent swap

If navigation is cancelled before the clone is consumed (for example history back mid-transition), call:

```ts
const { abortConcurrent } = useFlyvaTransition();
abortConcurrent(); // removes unused clone, shows source again
```

Returns whether anything was restored. Prefer this over reading `getCapturedClone()` internals.

## See also

- [Concurrent mode and content cloning](/guide/next/#concurrent-mode-and-content-cloning)
- [Transition modes (Next.js)](/guide/next/transition-modes)
- [API - outgoing helpers](/api/shared#outgoing-helpers-outgoingts)
