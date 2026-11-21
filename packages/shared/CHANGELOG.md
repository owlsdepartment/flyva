# @flyva/shared

## 0.9.0

### Minor Changes

- 3ac4df0: Add opt-in Next.js history navigation (`config.history`) with noop / snapshot / intercept strategies, shared `FlyvaNavigation` + `PageTransition.history` matching, and playground / e2e coverage.
- eec31e0: Add Next.js concurrent `prepareOutgoing` hooks (global, lifecycle, transition), `isolateOutgoing`, `freezeAnimations` / `freezeMedia` helpers, and `abortConcurrent()` for restoring unused clones. Shared plumbing remains available to adapters; Nuxt does not expose this as a user-facing API.
- 4d3e332: Add opt-in Next.js scroll restoration (`config.scroll`, `ctx.scroll`, Lenis-ready adapters) with shared `scrollToTarget`, `onStage`, and `setContextExtension`. Also harden history tracking (single popstate subscriber, hash-entry adoption, remove non-concurrent snapshot clones on commit).

## 0.8.4

### Patch Changes

- Hide the live page content under the concurrent leave clone so both do not show during navigation

## 0.8.3

### Patch Changes

- Harden default transition key fallback typing when no transitions are registered

## 0.8.2
