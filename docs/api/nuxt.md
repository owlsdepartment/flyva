# @flyva/nuxt

Nuxt 3 module. Components and composables are auto-imported — no explicit imports needed in Vue files.

Named composables are also available from **`@flyva/nuxt/composables`** (or the package root **`@flyva/nuxt`**) when you need an explicit import path.

## Module Options

Configured under the `flyva` key in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@flyva/nuxt'],
  flyva: {
    defaultKey: 'defaultTransition',
    transitionsDir: 'page-transitions',
    useNamedExports: true,
    viewTransition: true,
  },
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultKey` | `string` | `'defaultTransition'` | Transition key used when `flyva-transition` is not set on a link |
| `transitionsDir` | `string` | `'flyva-transitions'` | Directory containing transition files (relative to project root) |
| `useNamedExports` | `boolean` | `true` | If `true`, each named export becomes a separate transition. If `false`, the default export is used. |
| `viewTransition` | `boolean` | `undefined` | Enables `document.startViewTransition` in `FlyvaLink` when the browser supports it |

---

## Components

### FlyvaPage

Replaces `<NuxtPage />`. Wraps it with Vue's `<Transition>` (with `css: false`) and coordinates the leave/enter lifecycle with Nuxt's page hooks.

```vue
<template>
  <NuxtLayout>
    <FlyvaPage />
  </NuxtLayout>
</template>
```

**Internal hook bindings (simplified):**

| Nuxt hook | Role |
|-----------|------|
| `page:loading:start` | Starts the leave / enter promise coordination |
| `page:start` | Runs non–View-Transition leave path (or resolves early for VT / CSS-only cases) |
| `page:finish` | Runs concurrent enter, CSS-mode completion, or sequential enter depending on the active transition |

Vue `<Transition>` uses `mode: 'out-in'` for sequential transitions and `undefined` when `concurrent` or View Transitions are active so both roots can exist during the handoff.

Uses `defineOptions({ inheritAttrs: false })` and `v-bind="$attrs"` internally, so any attrs you add to `<FlyvaPage>` are forwarded to `<NuxtPage>`.

---

### FlyvaLink

Wraps `NuxtLink` with transition support. Auto-imported.

```vue
<FlyvaLink
  to="/about"
  flyva-transition="slideTransition"
  :flyva-options="{ direction: 'left' }"
  @transitionStart="onStart"
>
  About
</FlyvaLink>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `flyva-transition` | `string` | `config.defaultKey` | Which transition to run |
| `:flyva-options` | `PageTransitionOptions \| () => PageTransitionOptions` | `{}` | Data passed to `context.options` |

| Event | Payload | Description |
|-------|---------|-------------|
| `@transitionStart` | none | Emitted before the transition begins |

All `NuxtLink` props are accepted (`to`, `href`, `external`, `prefetch`, `replace`, etc.).

::: tip
`FlyvaLink` accesses the underlying DOM element via the NuxtLink component's `$el` property. This is passed as `context.el` to your transition code.
:::

---

## Composables

All composables are auto-imported by the module.

### useFlyvaTransition()

Returns the transition controller.

```ts
const { prepare, isRunning, stage, hasTransitioned } = useFlyvaTransition();
```

| Field | Type | Description |
|-------|------|-------------|
| `prepare(name, options, el?)` | `(string, PageTransitionOptions, Element?) => Promise<void>` | Start a transition by key |
| `isRunning` | `ComputedRef<boolean>` | Reactive flag — `true` while a transition is active |
| `stage` | `ComputedRef<PageTransitionStage>` | Current lifecycle stage (reactive) |
| `hasTransitioned` | `boolean` (getter) | `true` after the first transition |

---

### useFlyvaLifecycle(callbacks, options?)

Subscribe to transition lifecycle from any component. Uses `useNuxtApp().$flyvaManager` (same singleton as `FlyvaPage` / `FlyvaLink`).

```ts
useFlyvaLifecycle({
  beforeLeave(ctx) { console.log('leaving', ctx.name); },
  afterEnter(ctx) { console.log('entered', ctx.name); },
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
| `active` | `boolean` | `false` | When `true`, callbacks are registered as active hooks and awaited in parallel with the transition’s own hooks at each stage |

#### Passive mode (default)

Callbacks run when the manager’s `stage` changes. They do not block the transition.

#### Active mode

When `active: true`, each callback can return a `Promise` so your work is awaited together with the transition implementation (`Promise.all` on the manager side).

::: warning Vue clears template refs before active `leave` may finish

On a page navigation, Nuxt tears down the **old** page while Flyva may still be inside **`leave`**. Vue sets template `ref`s on that page to `null` as the DOM unmounts, so a normal `ref<HTMLElement>()` is often **`null` inside an async active `leave`** even though the transition has not finished.

Use **`useFlyvaStickyRef()`** (below) for elements you must read or animate from active lifecycle hooks. It keeps the last mounted node until Flyva runs active-hook unregister cleanup (after `leave`, when queued hook GC runs), then releases it.

Teleporting UI out of the animating subtree (e.g. to `body`) is another way to avoid losing the node, but sticky refs match how `registerActiveHook` teardown is ordered.

:::

```ts
const bar = useFlyvaStickyRef<HTMLDivElement>();

useFlyvaLifecycle(
  {
    async leave() {
      const el = bar.value;
      if (!el) return;
      await animate(el, { width: '100%', duration: 400 });
    },
  },
  { active: true },
);
```

---

### useFlyvaStickyRef()

Returns a **`Ref<T | null>`** (default `T` is `HTMLElement`) intended for template refs on markup you touch from **`useFlyvaLifecycle` with `active: true`**.

- Implemented with **`customRef`**: assigning **`null`** (Vue’s unmount reset) does **not** drop the stored element.
- On mount, registers an empty **`registerActiveHook({})`** so teardown participates in the same GC queue as other active hooks.
- When that unregister cleanup runs, the ref is cleared to `null` and dependents update.

```vue
<script setup lang="ts">
import { useFlyvaStickyRef } from '@flyva/nuxt/composables';

const bar = useFlyvaStickyRef<HTMLDivElement>();
</script>

<template>
  <div ref="bar">…</div>
</template>
```

Bind the returned ref on the element the same way as a normal Vue template ref.

---

### useFlyvaState()

Used internally by `FlyvaPage` for leave/enter promise coordination. Prefer `useFlyvaTransition` for app-level transition control unless you are extending the adapter.

---

### useRefStack(key, ref)

Registers a Vue ref in the global ref stack. Cleaned up automatically in `onUnmounted`.

```vue
<script setup>
const hero = ref(null);
useRefStack('hero', hero);
</script>
```

| Param | Type | Description |
|-------|------|-------------|
| `key` | `string` | Unique identifier |
| `ref` | `Ref<MaybeElement>` | Vue ref to register |

---

### globalGetRefStackItem(key)

Retrieves a ref from the global stack. Returns `Ref<T> | undefined`.

```ts
const hero = globalGetRefStackItem<HTMLElement>('hero');
if (hero?.value) { /* ... */ }
```

::: warning
In transition files (which run as virtual modules), use an explicit import path instead of relying on auto-imports:

```ts
import { globalGetRefStackItem } from '@flyva/nuxt/runtime/composables/useRefStack';
```
:::

---

### globalGetRefStack()

Returns the entire ref stack as `Record<string, Ref>`.

---

### useDetachedRoot(render)

Same idea as the Next adapter: mounts a one-off Vue app on a detached `div` appended to `document.body`. Returns `{ refs, waitForRender, destroy }` where `refs` is a lazy `ref()` map. Use from transition classes (as in the playground overlay) or client-only code; call `destroy()` in `cleanup()`.

---

## Auto-imports summary

| Name | Kind | Source |
|------|------|-------|
| `FlyvaPage` | Component | `@flyva/nuxt/runtime/components` |
| `FlyvaLink` | Component | `@flyva/nuxt/runtime/components` |
| `useFlyvaTransition` | Composable | `@flyva/nuxt/composables` |
| `useFlyvaLifecycle` | Composable | `@flyva/nuxt/composables` |
| `useFlyvaStickyRef` | Composable | `@flyva/nuxt/composables` |
| `useFlyvaState` | Composable | `@flyva/nuxt/composables` |
| `useRefStack` | Composable | `@flyva/nuxt/composables` |
| `useDetachedRoot` | Composable | `@flyva/nuxt/composables` |
| `globalGetRefStackItem` | Function | `@flyva/nuxt/composables` |
| `globalGetRefStack` | Function | `@flyva/nuxt/composables` |
