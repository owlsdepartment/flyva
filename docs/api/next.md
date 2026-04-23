# @flyva/next

Next.js (App Router) adapter. All exports are client-side (`'use client'`).

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
Transition instances are classes — they can't be serialized across the Server → Client boundary. Always wrap `FlyvaRoot` in a `'use client'` component.
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
| `flyvaTransition` | `string` | `config.defaultKey` | Which transition to run |
| `flyvaOptions` | `PageTransitionOptions \| () => PageTransitionOptions` | `{}` | Data passed to `context.options` |
| `onTransitionStart` | `() => void` | — | Callback fired before the transition starts |
| `onBeforeLeave` | `(context: PageTransitionContext) => void` | — | Fired at the `beforeLeave` stage |
| `onLeave` | `(context: PageTransitionContext) => void` | — | Fired at the `leave` stage |
| `onAfterLeave` | `(context: PageTransitionContext) => void` | — | Fired at the `afterLeave` stage |
| `onBeforeEnter` | `(context: PageTransitionContext) => void` | — | Fired at the `beforeEnter` stage |
| `onEnter` | `(context: PageTransitionContext) => void` | — | Fired at the `enter` stage |
| `onAfterEnter` | `(context: PageTransitionContext) => void` | — | Fired at the `afterEnter` stage |
| `ref` | `Ref<HTMLAnchorElement>` | — | Forwarded to the underlying `<a>` element |

All `next/link` `LinkProps` are also accepted (`href`, `prefetch`, `replace`, `scroll`, etc.).

#### Bypass mode

When `flyva={false}`, the component renders a plain `next/link` with no click interception and no transition. This lets you use `FlyvaLink` as a global `Link` replacement while opting out for specific links:

```tsx
<FlyvaLink href="/external-page" flyva={false}>
  Plain navigation
</FlyvaLink>
```

#### Lifecycle callbacks

The `on*` callback props fire in **passive mode** — they are called at each lifecycle stage but do not block the transition. Use them for side effects like analytics, logging, or toggling UI state:

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

Client component that wraps the part of the tree that swaps on navigation. It registers the content element with `PageTransitionManager`, runs `enter()` after `usePathname` changes, and supports **concurrent** clones, **CSS mode**, and **View Transitions** coordination. Place it **inside** your `data-flyva-content` (or equivalent) wrapper around `{children}` in the App Router layout.

For **`concurrent: true`**, Flyva inserts a **DOM clone** during `prepare` so leave can run against pixels while navigation proceeds; that pattern is inherently fragile on the App Router (layout shift, replayed CSS, refs). See the [Next.js guide — concurrent mode and content cloning](/guide/next#concurrent-mode-and-content-cloning) or prefer **View Transitions** in config.

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

Subscribe to transition lifecycle events from any component inside `FlyvaRoot`. Supports two modes:

```ts
useFlyvaLifecycle({
  beforeLeave(ctx) { console.log('leaving', ctx.name); },
  afterEnter(ctx)  { console.log('entered', ctx.name); },
});
```

**`FlyvaLifecycleCallbacks`:**

| Callback | Type |
|----------|------|
| `beforeLeave` | `(context: PageTransitionContext) => void \| Promise<void>` |
| `leave` | `(context: PageTransitionContext) => void \| Promise<void>` |
| `afterLeave` | `(context: PageTransitionContext) => void \| Promise<void>` |
| `beforeEnter` | `(context: PageTransitionContext) => void \| Promise<void>` |
| `enter` | `(context: PageTransitionContext) => void \| Promise<void>` |
| `afterEnter` | `(context: PageTransitionContext) => void \| Promise<void>` |

**`UseFlyvaLifecycleOptions`:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `active` | `boolean` | `false` | When `true`, the hook's callbacks are awaited in parallel with the transition's own lifecycle hooks |

#### Passive mode (default)

Callbacks fire when the manager's stage changes. They do not block or delay the transition — fire-and-forget.

#### Active mode

When `active: true`, the hook registers itself with the `PageTransitionManager`. At each lifecycle step, the manager runs the transition's hook and all registered active hooks in parallel (`Promise.all`). Your callback can return a `Promise` to co-animate alongside the main transition.

If the component unmounts mid-transition, the hook automatically unregisters and resolves any outstanding promises so the transition is never blocked by a destroyed component.

```ts
useFlyvaLifecycle({
  async leave(ctx) {
    await animateProgressBar(ctx);
  },
}, { active: true });
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

**Returns:** `() => void` — a manual removal function.

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
