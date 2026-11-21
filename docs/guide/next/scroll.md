# Scroll restoration (Next.js)

Opt-in scroll handling in `@flyva/next`. Without `config.scroll`, Flyva does not touch scroll restoration. **Next.js only** - Nuxt should use Vue Router [`scrollBehavior`](https://router.vuejs.org/guide/advanced/scroll-behavior.html) (see [Nuxt note](#nuxt)).

Pairs cleanly with [`config.history`](/guide/next/history): `FlyvaScroll` is mounted **before** `FlyvaHistory` so outgoing positions are recorded before a history transition starts or cancels.

## Config

```tsx
<FlyvaRoot
  transitions={transitions}
  config={{
    scroll: {
      adapter: () => lenisAdapter(), // optional; default = window
      restoreAt: 'beforeEnter',
      restoreTimeout: 1000,
    },
  }}
/>
```

| Field | Description |
|-------|-------------|
| `adapter` | `FlyvaScrollAdapter` or a lazy factory. Default scrolls the window. |
| `restoreAt` | Default restore point (`beforeEnter` \| `enter` \| `afterEnter` \| `manual`). |
| `restoreTimeout` | Max ms to keep re-applying a target the page is not tall enough for yet (default `1000`). |

While installed, `history.scrollRestoration = 'manual'` (restored on unmount).

### Adapter (Lenis)

`get` / `set` are required. `set` must jump **immediately** (no smooth scroll). Optional `lock` / `unlock` pause the scroller during the transition:

```ts
const lenisAdapter = (): FlyvaScrollAdapter | undefined => {
  const lenis = getLenis();
  return lenis
    ? {
        get: () => lenis.scroll,
        set: top => lenis.scrollTo(top, { immediate: true, force: true }),
        lock: () => lenis.stop(),
        unlock: () => lenis.start(),
      }
    : undefined;
};
```

## Per-transition options

Augmented on shared `PageTransition` by `@flyva/next`:

| Field | Description |
|-------|-------------|
| `scrollRestoreAt` | Override the restore point for this transition. |
| `scrollTarget(ctx, fallback)` | Override the computed target (return `null` to leave scroll as is). |

**Restore point resolution:** `transition.scrollRestoreAt` → `config.scroll.restoreAt` → **`afterEnter`** if the transition is `concurrent` (the leave clone is still in flow above the new page) → otherwise **`beforeEnter`**.

With `manual`, call `ctx.scroll.restore()` yourself. If you never do, cleanup applies the target as a safety net.

## `ctx.scroll`

Present when `config.scroll` is set:

```ts
ctx.scroll?.target   // { top } | { hash } | { element } | null
ctx.scroll?.from     // outgoing page scroll top
ctx.scroll?.restore() // apply now; idempotent
await ctx.scroll?.restored // resolves when reached, or after restoreTimeout
```

Typical enter reveal that waits for restore:

```ts
async enter({ scroll }) {
  await scroll?.restored;
  await gsap.to(overlay, { opacity: 0 });
}
```

## Behaviour

- **Saving:** positions are stored per history entry (memory + `history.state.__flyvaScroll`). Debounced on `scroll` (100ms), synchronously before every `pushState`, and on `pagehide`. Skipped while a target is pending or a transition has not applied its target yet.
- **Push via `FlyvaLink`:** `router.push(href, { scroll: false })` so Next cannot jump the outgoing page. Target is the link hash (`{ hash }`) or `{ top: 0 }`. A plain Next `<Link>` / `flyva={false}` keeps Next’s scroll; the outgoing position is still saved.
- **Back / forward:** target is the destination entry’s saved position, else `{ hash }` for same-document pops, else `{ top: 0 }`. Computed inside `popstate` before anything moves.
  - With a Flyva history transition: applied at the restore point.
  - Without one (`history` off, or strategy returns `false`): applied when Next commits (wrapper layout effect, before paint).
  - Same-document (hash) pops: applied immediately.
- **Reload:** re-applies the current entry’s saved position on install (timeout `max(restoreTimeout, 3000)`).
- **Applying:** shared `scrollToTarget` re-applies every frame until reached (or timeout). Aborted by user input (`wheel` / `touchstart` / `keydown` / `pointerdown`). Anchors respect `scroll-margin-top`; `#` and `#top` mean `0`.
- **Interrupt (history jump):** cleanup unlocks and does **not** apply a cancelled target when a newer traversal is pending.

## Quirks

- Saves listen to **window** scroll events only. An adapter that scrolls a nested element will not be saved automatically. Lenis scrolls the window, so it is fine.
- Vertical only (no `left`).
- Entries without Flyva/Next state (e.g. before hydration) are tracked in memory only. Flyva never writes state into them - Next reloads the page when traversing into a state it did not write.
- `ctx.scroll` can remain on the manager context after cleanup until the next transition replaces it. Do not rely on it outside a transition.
- `FlyvaLink` to a hash on the **same pathname** does nothing today (`preventDefault` when paths match). Use a plain `<a href="#…">` for same-page anchors; those work and restore on back.
- **`config.viewTransition`:** enter stages are not run the same way; the target may only apply in cleanup after the VT finishes (visible jump). Prefer not combining scroll handling with View Transitions until that path is wired explicitly. History handling is already disabled when VT is on.

## Demo

Playground: `/scroll-demo` (tall sections + anchors). History demo links into `/scroll-demo#section-5`. See [Demos](/demos).

## Nuxt

No `@flyva/nuxt` scroll API. Use Vue Router:

```ts
// router options / app/router.options.ts
export default {
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, top: 0 };
    return { top: 0 };
  },
};
```

For late-growing pages, you can call shared [`scrollToTarget`](/api/shared#scrolltotarget-scrollts) inside a custom behavior that waits for layout.
