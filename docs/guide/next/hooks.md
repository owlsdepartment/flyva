# Hooks (Next.js)

## `useFlyvaLifecycle`

`useFlyvaLifecycle` lets any component inside `FlyvaRoot` react to transition lifecycle stages. It **always** registers with `PageTransitionManager` as an active hook. With **`blocking: false`** (default), `prepare` / `leave` / `enter` do not hold up the manager (returned promises are not awaited); with **`blocking: true`**, those three steps await your work like the transition’s own hooks.

**Non-blocking mode** (default, `blocking: false`) - boundary hooks are synchronous; `prepare` / `leave` / `enter` run without delaying the transition:

```tsx
'use client';
import { useFlyvaLifecycle } from '@flyva/next';

function Analytics() {
  useFlyvaLifecycle({
    beforeLeave(ctx) { trackPageLeave(ctx.name); },
    afterEnter(ctx)  { trackPageEnter(ctx.name); },
  });
  return null;
}
```

**Blocking mode** (`blocking: true`) - `prepare`, `leave`, and `enter` are awaited in parallel with the transition’s own hooks (`Promise.all` per stage). Use when a component must finish its own animation before that step completes:

```tsx
'use client';
import { useFlyvaLifecycle } from '@flyva/next';

function ProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useFlyvaLifecycle({
    async leave() {
      if (barRef.current) {
        await animate(barRef.current, { scaleX: 1, duration: 400 });
      }
    },
  }, { blocking: true });

  return <div ref={barRef} className="progress-bar" />;
}
```

If the component unmounts mid-transition, the hook unregisters automatically and resolves its outstanding promises so the transition is never blocked.

For per-link callbacks without a separate component, see [FlyvaLink](/guide/next/flyva-link#lifecycle-callback-props).

## `useFlyvaTransition`

`useFlyvaTransition` exposes the current transition run for UI (e.g. loading states): `prepare`, `isRunning`, `stage`, `hasTransitioned`. It does not replace transition implementations on `PageTransition`. See [`useFlyvaTransition` in the API](/api/next#useflyvatransition).

## Related

- [FlyvaLink](/guide/next/flyva-link)
- [Writing transitions](/guide/next/writing-transitions)
