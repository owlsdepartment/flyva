# @flyva/nuxt

Nuxt 3 module. Components and composables are auto-imported — no explicit imports needed in Vue files.

## Module Options

Configured under the `flyva` key in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@flyva/nuxt'],
  flyva: {
    defaultKey: 'defaultTransition',
    transitionsDir: 'page-transitions',
    useNamedExports: true,
  },
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultKey` | `string` | `'defaultTransition'` | Transition key used when `flyva-transition` is not set on a link |
| `transitionsDir` | `string` | `'flyva-transitions'` | Directory containing transition files (relative to project root) |
| `useNamedExports` | `boolean` | `true` | If `true`, each named export becomes a separate transition. If `false`, the default export is used. |

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

**Internal hook bindings:**

| Nuxt hook | What happens |
|-----------|-------------|
| `page:loading:start` | Creates leave and enter promises |
| `page:start` | Resolves the leave promise (page swap happens) |
| `page:finish` | Resolves the enter promise (enter animation completes) |

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

## Auto-imports summary

| Name | Kind | Source |
|------|------|-------|
| `FlyvaPage` | Component | `@flyva/nuxt/runtime/components` |
| `FlyvaLink` | Component | `@flyva/nuxt/runtime/components` |
| `useFlyvaTransition` | Composable | `@flyva/nuxt/runtime/composables` |
| `useRefStack` | Composable | `@flyva/nuxt/runtime/composables` |
| `globalGetRefStackItem` | Function | `@flyva/nuxt/runtime/composables` |
| `globalGetRefStack` | Function | `@flyva/nuxt/runtime/composables` |
