# Hooks (Nuxt)

The module registers composables as auto-imports. For explicit imports (e.g. transition virtual modules, tests, or when your IDE does not resolve auto-imports), import from **`@flyva/nuxt/composables`** or **`@flyva/nuxt`**.

## Transition state: `useFlyvaTransition`

`useFlyvaTransition()` returns `{ prepare, isRunning, stage, hasTransitioned }` for UI tied to the active run. See the [API reference](/api/nuxt#useflyvatransition).

## `useFlyvaLifecycle`

`useFlyvaLifecycle` mirrors the Next adapter: it **always** registers with `PageTransitionManager`. **`blocking: false`** (default) still runs every hook on the manager timeline but does not await `prepare` / `leave` / `enter`. **`blocking: true`** awaits those three in parallel with the transition implementation.

On Nuxt, the outgoing page component often **unmounts before** Flyva’s `leave` phase finishes. Vue then sets bound template refs to `null` while your async `leave` callback may still be running. A plain `ref()` on markup inside that page is therefore unreliable for DOM work in **blocking** `leave` / `afterLeave`.

Use **`useFlyvaStickyRef()`** for those elements: it ignores Vue’s unmount `null` write, keeps the last non-null element until active-hook unregister cleanup runs (after `leave`, when the manager flushes hook GC), then clears. See the [Nuxt API reference](/api/nuxt#useflyvalifecycle-callbacks-options) for signatures and options.

## Other auto-imports (reference)

| Composable | Returns |
|------------|---------|
| `useFlyvaStickyRef()` | `Ref<HTMLElement \| null>` that keeps the last mounted DOM node through page teardown until Flyva clears active hooks |
| `useFlyvaState()` | Internal coordination helpers used by `FlyvaPage` |
| `useRefStack(key, ref)` | Registers a Vue ref in the global stack — see [Ref Stack](/guide/nuxt/ref-stack) |
| `useDetachedRoot(render)` | Detached Vue tree for overlays — see [Writing transitions](/guide/nuxt/writing-transitions#interactive-overlay-with-usedetachedroot) |
| `globalGetRefStackItem(key)` | Gets a ref by key |
| `globalGetRefStack()` | Gets the entire stack |

## Related

- [FlyvaLink](/guide/nuxt/flyva-link)
- [Writing transitions](/guide/nuxt/writing-transitions)
