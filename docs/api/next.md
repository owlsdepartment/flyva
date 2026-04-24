# @flyva/next

Next.js (App Router) adapter. All exports are client-side (`'use client'`).

Named hooks and components are also available from **`@flyva/next/hooks`** and **`@flyva/next/components`** (or the package root **`@flyva/next`**) when you want an explicit import path.

## Import paths

| Subpath | Contents |
|---------|----------|
| **`@flyva/next`** | Full adapter: components, hooks, and re-exports from `@flyva/shared` |
| **`@flyva/next/hooks`** | `useFlyvaTransition`, `useFlyvaLifecycle`, `useFlyvaConfig`, `useFlyvaManager`, `useRefStack`, `globalGetRefStackItem`, `useDetachedRoot`, … |
| **`@flyva/next/components`** | `FlyvaRoot`, `FlyvaLink`, `FlyvaTransitionWrapper` |

## Components

### FlyvaRoot

Provider component. Creates a `PageTransitionManager` singleton and makes it available to child components via React context.

```tsx
<FlyvaRoot transitions={transitions} config={{ defaultKey: 'fadeTransition' }}>
  {children}
</FlyvaRoot>
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `transitions` | `Record<string, PageTransition>` | yes | Map of named transition instances |
| `config` | `Partial<FlyvaConfig>` | no | Config overrides |

**FlyvaConfig:**

| Field | Type | Default |
|-------|------|---------|
| `defaultKey` | `string` | `'defaultTransition'` |
| `viewTransition` | `boolean` | `undefined` |
| `lifecycleClassPrefix` | `string` | `'flyva'` |

::: warning
Transitions depend on client-side APIs (DOM, `document`, and so on) and must be registered under `FlyvaRoot` in a Client Component. Always wrap `FlyvaRoot` in a `'use client'` component.
:::

---

### FlyvaLink

Drop-in replacement for `next/link` with transition support. Intercepts clicks, runs the leave animation, then pushes the route.

```tsx
<FlyvaLink
  href="/about"
  flyvaTransition="slideTransition"
  flyvaOptions={{ direction: 'left' }}
  onTransitionStart={() => console.log('starting')}
>
  About
</FlyvaLink>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `flyva` | `boolean` | `true` | Set to `false` to bypass Flyva and render a plain `next/link` |
| `flyvaTransition` | `string` | - (optional) | When set, that map key runs. When omitted, the manager resolves a key via each transition’s optional `condition`, then `config.defaultKey` as `defaultTransitionKey` (see [Writing transitions](/guide/next/writing-transitions#transition-resolution)) |
| `flyvaOptions` | `PageTransitionOptions \| () => PageTransitionOptions` | `{}` | Data passed to `context.options` |
| `onTransitionStart` | `() => void` | - | Callback fired before the transition starts |
| `onBeforeLeave` | `(context: PageTransitionContext) => void` | - | Fired at the `beforeLeave` stage |
| `onLeave` | `(context: PageTransitionContext) => void` | - | Fired at the `leave` stage |
| `onAfterLeave` | `(context: PageTransitionContext) => void` | - | Fired at the `afterLeave` stage |
| `onBeforeEnter` | `(context: PageTransitionContext) => void` | - | Fired at the `beforeEnter` stage |
| `onEnter` | `(context: PageTransitionContext) => void` | - | Fired at the `enter` stage |
| `onAfterEnter` | `(context: PageTransitionContext) => void` | - | Fired at the `afterEnter` stage |
| `ref` | `Ref<HTMLAnchorElement>` | - | Forwarded to the underlying `<a>` element |

All `next/link` `LinkProps` are also accepted (`href`, `prefetch`, `replace`, `scroll`, etc.).

#### Bypass mode

When `flyva={false}`, the component renders a plain `next/link` with no click interception and no transition. This lets you use `FlyvaLink` as a global `Link` replacement while opting out for specific links:

```tsx
<FlyvaLink href="/external-page" flyva={false}>
  Plain navigation
</FlyvaLink>
```

#### Lifecycle callbacks

The `on*` callback props mirror `useFlyvaLifecycle` delivery: they run for each stage but **`onPrepare` / `onLeave` / `onEnter` do not delay navigation** (returned promises are not awaited by the link). `onPrepare` may still be `async`. Use them for side effects like analytics, logging, or toggling UI state:

```tsx
<FlyvaLink
  href="/about"
  onBeforeLeave={() => setIsTransitioning(true)}
  onAfterEnter={() => setIsTransitioning(false)}
>
  About
</FlyvaLink>
```

---

### FlyvaTransitionWrapper

Client component that wraps the part of the tree that swaps on navigation. It registers that subtree with `PageTransitionManager` (so transition hooks get `context.container` / `current` / `next`), runs `enter()` after `usePathname` changes, and supports **concurrent** clones, **CSS mode**, and **View Transitions** coordination. Wrap `{children}` (or the segment you want to treat as page content) in your App Router layout.

For **`concurrent: true`**, Flyva inserts a **DOM clone** during `prepare` so leave can run against pixels while navigation proceeds; that pattern is inherently fragile on the App Router (layout shift, replayed CSS, refs). See the [Next.js guide - concurrent mode and content cloning](/guide/next/#concurrent-mode-and-content-cloning) or prefer **View Transitions** in config.

---

## Hooks

### useFlyvaTransition()

Returns the transition controller. This is the main hook used by `FlyvaLink` internally, but you can also call it directly for programmatic transitions.

```ts
const {
  prepare,
  leave,
  enter,
  leaveWithViewTransition,
  hasTransitioned,
  isConcurrent,
  isViewTransition,
} = useFlyvaTransition();
```

| Field | Type | Description |
|-------|------|-------------|
| `prepare(name, options, el?)` | `(string, PageTransitionOptions, Element?) => Promise<void>` | Start a transition by key; may insert a concurrent clone when applicable |
| `leave()` | `() => Promise<void>` | Run beforeLeave → leave → afterLeave (or CSS-mode / clone prep only as implemented) |
| `enter()` | `() => Promise<void>` | Run beforeEnter → enter → afterEnter (typically after navigation + wrapper layout effect) |
| `leaveWithViewTransition(navigate)` | `(navigate: () => void) => Promise<void>` | Wraps `navigate` in `startViewTransition`; used by `FlyvaLink` when `config.viewTransition` is on |
| `hasTransitioned` | `boolean` (getter) | `true` after the first transition has run |
| `isConcurrent` | `boolean` (getter) | `true` when the active transition has `concurrent: true` |
| `isViewTransition` | `boolean` (getter) | `true` when `config.viewTransition` is enabled |

---

### useFlyvaConfig()

Returns the current `FlyvaConfig`. Must be called inside `FlyvaRoot`.

```ts
const config = useFlyvaConfig();
config.defaultKey // 'defaultTransition'
```

---

### useFlyvaManager()

Returns the raw `PageTransitionManager` instance. Must be called inside `FlyvaRoot`. Useful for reading `isRunning`, `stage`, or calling lifecycle methods directly.

```ts
const manager = useFlyvaManager();
manager.isRunning  // boolean
manager.stage      // PageTransitionStage
```

---

### useFlyvaLifecycle(callbacks, options?)

Subscribe to transition lifecycle events from any component inside `FlyvaRoot`. The hook **always** registers with `PageTransitionManager` as an active hook, so your callbacks run in the same pipeline as transition implementations (including `prepare` on `run()`).

```ts
useFlyvaLifecycle({
  beforeLeave(ctx) { console.log('leaving', ctx.name); },
  afterEnter(ctx)  { console.log('entered', ctx.name); },
});
```

**`FlyvaLifecycleCallbacks`:**

| Callback | Type | Notes |
|----------|------|--------|
| `prepare` | `(context: PageTransitionContext) => void \| Promise<void>` | With `blocking: false`, the manager does not wait for returned promises |
| `beforeLeave` | `(context: PageTransitionContext) => void` | Sync only (matches `PageTransition`) |
| `leave` | `(context: PageTransitionContext) => void \| Promise<void>` | With `blocking: true`, awaited in parallel with the transition’s `leave` |
| `afterLeave` | `(context: PageTransitionContext) => void` | Sync only |
| `beforeEnter` | `(context: PageTransitionContext) => void` | Sync only |
| `enter` | `(context: PageTransitionContext) => void \| Promise<void>` | With `blocking: true`, awaited in parallel with the transition’s `enter` |
| `afterEnter` | `(context: PageTransitionContext) => void` | Sync only |
| `cleanup` | `() => void` | Sync only; no context (matches `PageTransition.cleanup`) |

**`UseFlyvaLifecycleOptions`:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blocking` | `boolean` | `false` | When `false`, `prepare` / `leave` / `enter` are still invoked on the manager timeline but returned promises are **not** awaited - work is scheduled so the transition is not held up. When `true`, those three steps await your callback (including async work); cancellable in-flight work is cleared on unmount. |

#### Non-blocking mode (default, `blocking: false`)

Boundary hooks (`beforeLeave`, `afterLeave`, …) run synchronously when the manager enters each stage. For `prepare`, `leave`, and `enter`, the adapter returns an immediately resolved promise to the manager while your callback runs on a microtask chain so async errors do not reject the transition.

#### Blocking mode (`blocking: true`)

`prepare`, `leave`, and `enter` are awaited together with the transition’s hooks (`Promise.all` per stage). Use this when a component must finish its own animation before the lifecycle step completes.

If the component unmounts mid-transition, the hook unregisters and in-flight cancellable work is settled so the transition is not left hanging.

```ts
useFlyvaLifecycle({
  async leave(ctx) {
    await animateProgressBar(ctx);
  },
}, { blocking: true });
```

---

### useRefStack(key, ref)

Registers a React ref in the global ref stack. Automatically removes it on unmount.

```ts
const hero = useRef<HTMLDivElement>(null);
useRefStack('hero', hero);
```

| Param | Type | Description |
|-------|------|-------------|
| `key` | `string` | Unique identifier for this ref |
| `ref` | `RefObject<MaybeElement>` | The React ref to register |

**Returns:** `() => void` - a manual removal function.

---

### globalGetRefStackItem(key)

Retrieves a ref from the global stack. Returns `RefObject<T> | null | undefined`.

```ts
const hero = globalGetRefStackItem<HTMLElement>('hero');
if (hero?.current) { /* ... */ }
```

---

### globalGetRefStack()

Returns the entire ref stack as `Record<string, RefObject>`.

---

### useDetachedRoot(jsxFactory)

Renders a React subtree into a detached `div` on `document.body`. Useful for transition overlays that are not part of the page tree.

```ts
type OverlayRefs = { root: HTMLDivElement | null };

const { refs, waitForRender, destroy } = useDetachedRoot(r => (
  <div className="overlay" ref={r.root}>…</div>
));
await waitForRender();
// read refs.root.current …
destroy();
```

`refs` is a lazy `RefObject` map: accessing `r.root` creates `refs.root`. Always call `destroy()` when the overlay should go away (e.g. in `cleanup()`).
