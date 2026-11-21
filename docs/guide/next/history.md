# History navigation (Next.js)

Opt-in handling of browser **back / forward** (`popstate`) in `@flyva/next`. Without `config.history`, Flyva installs no listener and Next behaves as before.

This API is **Next-only**. Nuxt already gets overlapping leave / enter and scroll control from Vue Router - see [Nuxt note](#nuxt) below.

## Config

```tsx
<FlyvaRoot
  transitions={transitions}
  config={{
    history: {
      strategy: 'snapshot', // 'noop' | 'snapshot' | 'intercept' | (nav) => strategy | false
      defaultKey: 'backTransition',
      transition: ({ navigation, fromHref, toHref }) => undefined,
      interceptTimeout: 8000,
    },
  }}
/>
```

| Field | Description |
|-------|-------------|
| `strategy` | How the **outgoing** page is handled (default `noop`). Function form runs synchronously inside `popstate`; return `false` to skip Flyva for that move. |
| `defaultKey` | Fallback map key for history moves when nothing matches (tried before `config.defaultKey`). |
| `transition` | Optional explicit picker; return `undefined` to fall through to normal matching. |
| `interceptTimeout` | `intercept` only: max wait (ms) for Next to commit after the event is re-dispatched (default `8000`). |

Disabled when `config.viewTransition` is on (one-time dev warning).

### Transition `history` flag

On shared `PageTransition`:

| Value | Effect |
|-------|--------|
| unset / `true` | Matched for link navigations and history moves |
| `false` | Never matched for back / forward |
| `'only'` | Matched only for back / forward |

### Key resolution

1. `history.transition(...)`
2. `matchTransitionKey` (filtered by the `history` flag)
3. `history.defaultKey`
4. `config.defaultKey` (`defaultTransitionKey`)

### `ctx.navigation`

During a history-handled move, lifecycle / `condition` context includes:

```ts
ctx.trigger === 'history'
ctx.navigation // { type: 'traverse', direction: 'back' | 'forward' | 'none', delta, strategy? }
```

Both are cleared on `finishTransition`. Direction comes from an index stamped into `history.state.__flyvaIndex` via wrapped `pushState` / `replaceState`. Entries created before hydration, or by code that replaces `history.state` wholesale, give `direction: 'none'`.

## Strategies

Names describe what happens to the **old page**. They are independent of whether the transition itself is `concurrent`.

| Strategy | Old page | How |
|----------|----------|-----|
| `noop` (default) | Gone immediately | Next swaps; Flyva only runs prepare / enter (reveals, etc.). Safest. |
| `snapshot` | A clone stays and leaves | DOM is cloned synchronously in the capture-phase `popstate`, before React commits, then inserted and run through `prepareOutgoing` → leave while Next renders the new page. |
| `intercept` | Live page leaves before the swap | `stopImmediatePropagation()` on `popstate`, leave on the live page, then re-dispatch a synthetic `PopStateEvent` so Next navigates. |

Returning `false` from the strategy function means no Flyva transition for that move.

### Quirks - `snapshot`

- The clone is **static DOM**. React state, canvases / WebGL, iframes, and playing media are not live. Patch with [`prepareOutgoing`](/guide/prepare-outgoing) / `freezeMedia` / `freezeAnimations`.
- `condition`, `history.transition`, and `prepareOutgoing` hooks must stay **synchronous**. If React commits the new page before the clone is inserted, leave is skipped with a dev warning ("missed the page swap").
- The URL already shows the new page while the old one animates out.

### Quirks - `intercept`

- Relies on Next’s internal `popstate` listener on `window` (bubble phase) accepting a synthetic, re-dispatched `PopStateEvent`. **This is a Next internals hack** and can break on any Next upgrade. Verified against **Next 16.2.4**.
- The URL has already changed when `popstate` fires (the browser cannot be stopped). Only the render is delayed.
- If Next does not commit after the replay within `interceptTimeout`, a dev warning fires and the transition is cancelled without enter.

### Quirks - all strategies

- **Interrupts use a jump policy:** another back / forward during a running history transition cancels it (`abortConcurrent`, release enter gate, `finishTransition`). Only **`cleanup`** runs for the cancelled transition - **not** `afterLeave`. Reset `pointer-events`, `overflow`, and inline styles in `cleanup` as well as (or instead of) `afterLeave`.
- Same-document pops (hash changes or the same pathname, trailing slash normalized) are ignored.

## Demo

Playground: [`/history-demo`](/demos) (Next playground nav → History). Strategy and transition overrides are stored in `sessionStorage` under `flyva-demo:history`.

## Nuxt

There is **no** `@flyva/nuxt` history API. Use Vue Router:

- [`scrollBehavior`](https://router.vuejs.org/guide/advanced/scroll-behavior.html) for scroll restoration
- Navigation guards / `router.beforeEach` if you need to branch on direction
- `FlyvaPage` + Vue `<Transition>` already keep the outgoing page mounted for concurrent leave

Detecting back / forward without Flyva (index stamping pattern):

```ts
// plugins/history-direction.client.ts
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return;

  const KEY = '__flyvaIndex';
  const state = history.state;
  if (!state || typeof state[KEY] !== 'number') {
    history.replaceState({ ...(state ?? {}), [KEY]: 0 }, '');
  }

  window.addEventListener('popstate', () => {
    const next = history.state?.[KEY];
    // compare to a stored previous index to derive back / forward
  });
});
```

For overlapping leave animations, prefer a concurrent transition on Nuxt rather than cloning.
