# AGENTS.md

Notes for **AI coding agents** and humans automating work in this repository. For contributor-facing process, see [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md).

## What this repo is

**Flyva** — page transition orchestration for **Next.js** (`@flyva/next`) and **Nuxt** (`@flyva/nuxt`), built on a shared **`@flyva/shared`** core (`PageTransitionManager`, `PageTransition` lifecycle). Adapters wire framework routers, DOM roots, and links into that core.

## Layout (pnpm workspaces)

| Path | Role |
|------|------|
| `packages/shared` | **Library** — `@flyva/shared`: framework-agnostic manager, types, helpers |
| `packages/next` | **Library** — `@flyva/next`: App Router adapter (React) |
| `packages/nuxt` | **Library** — `@flyva/nuxt`: Nuxt 4 module (Vue) |
| `playground/next`, `playground/nuxt` | **Playground** — demo / manual integration apps |
| `playground/next-vt`, `playground/nuxt-vt` | **Playground** — View Transitions–oriented demos |
| `docs/` | **Docs** — VitePress site (public-facing like the packages) |

- Workspace dependencies use `"workspace:*"`.
- **`PageTransitionManager`** and related types live under `packages/shared/page-transition-manager/`.

### Library (`packages/`) vs playgrounds (`playground/`)

- **`packages/`** is what ships to npm. Treat it as **production-quality and public-facing**: stable APIs, consistent naming, backwards compatibility, tests for behavior you rely on, and changes that match the rest of the surface area.
- **`playground/`** is for **demos, spikes, and manual testing**. It can move quickly, try ideas, or look rougher than the library. Prefer **not** to blur the line (e.g. don’t paper over a bad library API by special-casing only in a playground unless the task is explicitly playground-only).

## Commands

```bash
pnpm install          # after clone; use corepack + pnpm per CONTRIBUTING
pnpm dev:next         # Next playground
pnpm dev:nuxt         # Nuxt playground
pnpm dev:next:vt      # Next VT playground
pnpm dev:nuxt:vt      # Nuxt VT playground
pnpm dev:docs         # VitePress dev server
pnpm docs:build       # verify docs compile
pnpm test:unit        # Vitest — @flyva/shared
pnpm test:e2e         # Playwright — next + nuxt packages
pnpm lint             # eslint (packages) + stylelint
pnpm build            # package build script
```

Pre-push hooks run linters; commits must follow **Conventional Commits** (see CONTRIBUTING).

## Where to change what

- **Lifecycle, matching, CSS/VT helpers, types** → usually `packages/shared`.
- **Next-only behavior** (Link, root, wrapper, hooks) → `packages/next`.
- **Nuxt-only behavior** (module, FlyvaPage, FlyvaLink, composables) → `packages/nuxt`.
- **Docs** → `docs/` (VitePress config in `docs/.vitepress/config.ts`).
- **E2E** → `packages/next/e2e`, `packages/nuxt/e2e`; read **`.cursor/rules/playwright-e2e-policy.mdc`** before adding or reshaping specs.

## Cursor rules (optional but useful)

Project-specific guidance lives under **`.cursor/rules/`** (e.g. `project-overview.mdc`, `shared-package.mdc`, `next-package.mdc`, `nuxt-package.mdc`, `playground.mdc`, `import-conventions.mdc`, `transitions.mdc`, `docs-writing.mdc`). Prefer matching existing patterns there over inventing new ones.

## Expectations for agents

- Keep changes **scoped** to the request; avoid unrelated refactors and extra files (including unsolicited READMEs or doc pages unless asked).
- When editing **`packages/*`**, prioritize **API consistency**, clear types, and behavior covered by **unit or e2e tests**; breaking or widening the public contract deserves extra scrutiny and usually belongs in the same change as docs or migration notes.
- When editing **`playground/*`**, optimize for **clarity of the demo** and fast feedback for humans; it is fine to refactor layout, copy, or example transitions for readability **without** treating every tweak as a semver concern—still avoid committing secrets or misleading patterns that contradict the library docs.
- **Match** local naming, imports, and test style in the tree you touch (stricter in packages, more flexible in playgrounds unless a rule file says otherwise).
- After behavioral changes under **`packages/`**, prefer **tests** (`test:unit` / `test:e2e`) or at least **`pnpm docs:build`** when docs change.
