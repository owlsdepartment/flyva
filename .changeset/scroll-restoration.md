---
'@flyva/shared': minor
'@flyva/next': minor
---

Add opt-in Next.js scroll restoration (`config.scroll`, `ctx.scroll`, Lenis-ready adapters) with shared `scrollToTarget`, `onStage`, and `setContextExtension`. Also harden history tracking (single popstate subscriber, hash-entry adoption, remove non-concurrent snapshot clones on commit).
