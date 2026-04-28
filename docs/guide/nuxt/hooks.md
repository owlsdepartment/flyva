# Hooks (Nuxt)

The module registers composables as auto-imports. For explicit imports (e.g. transition virtual modules, tests, or when your IDE does not resolve auto-imports), use **`@flyva/nuxt/composables`**, **`@flyva/nuxt/components`**, or the package root **`@flyva/nuxt`**.

## Transition state: `useFlyvaTransition`

`useFlyvaTransition()` returns `{ prepare, isRunning, stage, hasTransitioned }` for UI tied to the active run. See the [API reference](/api/nuxt#useflyvatransition).

## `useFlyvaLifecycle`

`useFlyvaLifecycle` lets any component react to transition lifecycle stages. It **always** registers with `PageTransitionManager` as an active hook. With **`blocking: false`** (default), `prepare` / `leave` / `enter` do not hold up the manager (returned promises are not awaited); with **`blocking: true`**, those three steps await your work like the transition’s own hooks.

::: warning Nuxt template ref caveat
On Nuxt, the outgoing page component can unmount before async `leave` finishes, so bound template refs may become `null` while your callback is still running. Use **`useFlyvaStickyRef()`** when a blocking callback needs a stable DOM element from the outgoing page. It ignores Vue’s unmount `null` write, keeps the last non-null element until active-hook unregister cleanup runs, then clears. See the [Nuxt API reference](/api/nuxt#useflyvalifecycle-callbacks-options) for signatures and options.
:::

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
