# FlyvaLink (Next.js)

`FlyvaLink` is a drop-in replacement for Next.js `Link`. It intercepts clicks, runs the leave animation, then pushes the route.

```tsx
import { FlyvaLink } from '@flyva/next';

<FlyvaLink href="/about">About</FlyvaLink>
```

## Choosing a transition per link

If you set **`flyvaTransition`**, that map key always runs. If you omit it, Flyva calls **`matchTransitionKey`**: each registered transition’s optional **`condition`** is evaluated in **`priority`** order (not object key order); if none do, **`config.defaultKey`** is used as `defaultTransitionKey` (default `'defaultTransition'`). See [Transition resolution](/guide/next/writing-transitions#transition-resolution).

```tsx
<FlyvaLink href="/work" flyvaTransition="slideTransition">Work</FlyvaLink>
```

## Passing options to transitions

Pass arbitrary data to your transition via `flyvaOptions`. The data lands on `context.options` inside every lifecycle hook:

```tsx
<FlyvaLink href="/work" flyvaOptions={{ direction: 'left' }}>
  Back to work
</FlyvaLink>
```

```ts
// Inside your transition
async leave(context) {
  const dir = context.options.direction === 'left' ? '100%' : '-100%';
  await animate(this.content, { translateX: dir, duration: 500 });
}
```

`flyvaOptions` also accepts a function `() => PageTransitionOptions` if you need to compute values at click time.

## Bypass mode

`FlyvaLink` accepts a `flyva` prop (default `true`). Set it to `false` to render a standard `next/link` with no transition interception. This lets you use `FlyvaLink` as a project-wide `Link` replacement while opting out for specific links:

```tsx
import { FlyvaLink } from '@flyva/next';

<FlyvaLink href="/about">About</FlyvaLink>               {/* transition */}
<FlyvaLink href="/terms" flyva={false}>Terms</FlyvaLink>   {/* plain navigation */}
```

## Lifecycle callback props

`FlyvaLink` exposes lifecycle callback props with the same delivery as non-blocking `useFlyvaLifecycle` (`onPrepare` / `onLeave` / `onEnter` do not block navigation):

```tsx
<FlyvaLink
  href="/about"
  onBeforeLeave={() => setLoading(true)}
  onAfterEnter={() => setLoading(false)}
>
  About
</FlyvaLink>
```

See the [API reference](/api/next#flyvalink) for the full list of callback props.

## Related

- [Overview](/guide/next/) — `FlyvaRoot`, `FlyvaTransitionWrapper`, config
- [View Transition API](/guide/next/view-transition-api) — when `config.viewTransition` is on
- [Hooks](/guide/next/hooks) — `useFlyvaLifecycle` from any component
