# FlyvaLink (Nuxt)

`FlyvaLink` wraps `NuxtLink` and is auto-imported - no explicit import needed.

```vue
<template>
  <FlyvaLink to="/about">About</FlyvaLink>
</template>
```

## Choosing a transition per link

Override the default transition for a specific link:

```vue
<FlyvaLink to="/work" flyva-transition="slideTransition">Work</FlyvaLink>
```

## Passing options to transitions

Pass arbitrary data via `:flyva-options`. It lands on `context.options` inside every lifecycle hook:

```vue
<FlyvaLink to="/work" :flyva-options="{ direction: 'left' }">
  Back to work
</FlyvaLink>
```

```ts
// Inside your transition
async leave(context) {
  const el = context.container;
  if (!el) return;
  const dir = context.options.direction === 'left' ? '100%' : '-100%';
  await animate(el, { translateX: dir, duration: 500 });
}
```

`:flyva-options` also accepts a function `() => PageTransitionOptions`.

## Bypass

Use `:flyva="false"` on `FlyvaLink` to render a plain `NuxtLink` without transition interception (same idea as the Next adapter’s `flyva` prop).

## Related

- [Overview](/guide/nuxt/) — module, `FlyvaPage`
- [View Transition API](/guide/nuxt/view-transition-api) — when `flyva.viewTransition` is on
- [Hooks](/guide/nuxt/hooks) — `useFlyvaLifecycle` and other composables
