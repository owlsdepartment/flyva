# @flyva/nuxt

## 0.9.0

### Minor Changes

- eec31e0: Add Next.js concurrent `prepareOutgoing` hooks (global, lifecycle, transition), `isolateOutgoing`, `freezeAnimations` / `freezeMedia` helpers, and `abortConcurrent()` for restoring unused clones. Shared plumbing remains available to adapters; Nuxt does not expose this as a user-facing API.

### Patch Changes

- Updated dependencies [3ac4df0]
- Updated dependencies [eec31e0]
- Updated dependencies [4d3e332]
  - @flyva/shared@0.9.0

## 0.8.4

### Patch Changes

- Hide the live page content under the concurrent leave clone so both do not show during navigation
- Updated dependencies
  - @flyva/shared@0.8.4

## 0.8.3

### Patch Changes

- Harden default transition key fallback typing when no transitions are registered
- Updated dependencies
  - @flyva/shared@0.8.3

## 0.8.2

### Patch Changes

- @flyva/shared@0.8.2
