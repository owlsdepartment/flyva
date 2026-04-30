---
title: Demos
description: Live Flyva playgrounds for Next.js and Nuxt, with and without the View Transitions API.
---

# Demos

These builds mirror the monorepo playgrounds deployed under **`/playground/…`** on the main site. Run the same apps locally with the root `pnpm` scripts from the repository.

## Next.js (App Router)

Default Flyva setup: `FlyvaRoot`, `FlyvaTransitionWrapper`, hook-driven transitions, and concurrent mode demos.

**[Open demo →](/playground/next/)**

- [Browse source on GitHub](https://github.com/owlsdepartment/flyva/tree/main/playground/next)
- Run locally: `pnpm dev:next` (from the repo root)

## Next.js + View Transitions API

Same stack with `config.viewTransition` enabled — `document.startViewTransition` and VT-oriented transitions.

**[Open demo →](/playground/next-vt/)**

- [Browse source on GitHub](https://github.com/owlsdepartment/flyva/tree/main/playground/next-vt)
- Run locally: `pnpm dev:next:vt`

## Nuxt 4

The `@flyva/nuxt` module with `FlyvaPage`, auto-imported composables, and classic JS hook transitions.

**[Open demo →](/playground/nuxt/)**

- [Browse source on GitHub](https://github.com/owlsdepartment/flyva/tree/main/playground/nuxt)
- Run locally: `pnpm dev:nuxt`

## Nuxt + View Transitions API

Nuxt playground with `flyva.viewTransition` enabled for VT-first flows.

**[Open demo →](/playground/nuxt-vt/)**

- [Browse source on GitHub](https://github.com/owlsdepartment/flyva/tree/main/playground/nuxt-vt)
- Run locally: `pnpm dev:nuxt:vt`

---

Full documentation lives under **[Getting started](/guide/getting-started)** in this site.
