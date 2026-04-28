---
layout: home
hero:
  name: Flyva
  text: Page transitions for Next.js & Nuxt
  tagline: A smart library for context-aware, smooth animated transitions between pages. A missing piece in a creative developer's toolkit for React and Vue.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/shared
features:
  - title: Framework-agnostic core
    details: Transitions implement a simple interface with lifecycle hooks. The same transition object works in both Next.js and Nuxt - only the wiring differs.
  - title: Bring your own animation library
    details: Flyva doesn't animate anything itself. Use anime.js, GSAP, Motion, CSS, or the View Transitions API - whatever fits your project.
  - title: Link-level control
    details: Override which transition plays on a per-link basis. Pass custom options (direction, easing, color) that your transition code can read at runtime.
  - title: Shared element transitions
    details: Register DOM refs globally with useRefStack and access them from transition code for FLIP animations across page boundaries.
---

**Flyva** is built and maintained by [Owls Department](https://owlsdepartment.com), a tech-led digital studio. Learn [more about the team](/about/authors). Released under the [MIT license](/about/license).
