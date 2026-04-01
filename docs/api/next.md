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
| `flyvaTransition` | `string` | `config.defaultKey` | Which transition to run |
| `flyvaOptions` | `PageTransitionOptions \| () => PageTransitionOptions` | `{}` | Data passed to `context.options` |
| `onTransitionStart` | `() => void` | — | Callback fired before the transition starts |
| `ref` | `Ref<HTMLAnchorElement>` | — | Forwarded to the underlying `<a>` element |

All `next/link` `LinkProps` are also accepted (`href`, `prefetch`, `replace`, `scroll`, etc.).

---

### FlyvaTransitionWrapper

Internal wrapper rendered by `FlyvaRoot`. Handles the enter animation after route changes using `usePathname`. Not typically used directly.

---

## Hooks

### useFlyvaTransition()

Returns the transition controller. This is the main hook used by `FlyvaLink` internally, but you can also call it directly for programmatic transitions.

```ts
const { prepare, leave, enter, hasTransitioned } = useFlyvaTransition();
```

| Field | Type | Description |
|-------|------|-------------|
| `prepare(name, options, el?)` | `(string, PageTransitionOptions, Element?) => Promise<void>` | Start a transition by key |
| `leave()` | `() => Promise<void>` | Run beforeLeave → leave → afterLeave |
| `enter()` | `() => Promise<void>` | Run beforeEnter → enter → afterEnter |
| `hasTransitioned` | `boolean` (getter) | `true` after the first transition has run |

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
