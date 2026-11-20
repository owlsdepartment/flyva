---
'@flyva/shared': minor
'@flyva/next': minor
'@flyva/nuxt': minor
---

Add Next.js concurrent `prepareOutgoing` hooks (global, lifecycle, transition), `isolateOutgoing`, `freezeAnimations` / `freezeMedia` helpers, and `abortConcurrent()` for restoring unused clones. Shared plumbing remains available to adapters; Nuxt does not expose this as a user-facing API.
