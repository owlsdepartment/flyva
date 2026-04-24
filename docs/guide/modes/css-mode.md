# CSS mode

In CSS mode Flyva drives **leave** and **enter** by adding and removing utility classes on the animated content root. You write CSS (or Tailwind `@apply`) against those classes; you do not implement `leave` / `enter` for the actual motion (and should omit them to avoid confusion - the dev build warns if they are present with `cssMode: true`).

## Enable on the transition

```ts
export const fadeCss = {
  cssMode: true,
  // prepare / beforeLeave / cleanup still run if you need them
};
```

The transition **key** (e.g. `fadeCss`) becomes the **prefix** for all generated class names.

## App configuration

CSS mode is used when **View Transitions** are **not** enabled at the app level.

- **Next.js** — do not set `viewTransition: true` on `FlyvaRoot` `config` (or leave it falsy).
- **Nuxt** — keep `flyva.viewTransition` unset/false. If `flyva.viewTransition` is true, Nuxt’s Flyva integration routes animation through the View Transitions path instead of the CSS class path for link navigations.

## Class sequence

Helpers in `@flyva/shared` (`applyCssStageClasses`) run this pattern for each phase:

**Leave**

1. Add `{name}-leave-from` and `{name}-leave-active`
2. Remove `{name}-leave-from`, add `{name}-leave-to`
3. Wait for transitions/animations on the element (or timeout)
4. Remove `{name}-leave-active` and `{name}-leave-to`

**Enter**

1. Add `{name}-enter-from` and `{name}-enter-active`
2. Remove `{name}-enter-from`, add `{name}-enter-to`
3. Wait, then remove `{name}-enter-active` and `{name}-enter-to`

Here `{name}` is the registered transition name (e.g. `slideTransition`).

## Example CSS

```css
.slideTransition-leave-active,
.slideTransition-enter-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.slideTransition-leave-from,
.slideTransition-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.slideTransition-leave-to,
.slideTransition-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
```

Target the **content root** the adapter animates (inside `FlyvaTransitionWrapper` on Next.js, or the element Flyva passes through Vue’s `<Transition>` on Nuxt).

## Nuxt and `FlyvaPage`

`FlyvaPage` runs the leave class phase inside `onLeave` and the enter phase in `onEnter` / `onBeforeEnter` depending on the active transition. With `cssMode` and without Flyva View Transitions, the page hook path resolves leave early so the DOM can swap, then completes enter styling on the new page.

## Related API

- `@flyva/shared`: `applyCssStageClasses`, `waitForAnimation`
- [Writing transitions](../transitions) for shared hooks like `prepare` and `cleanup`
- [Transition modes overview](./index) for how CSS mode fits next to JS and View Transitions
