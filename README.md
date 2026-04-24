# Flyva

Seamless page transitions for **Next.js** and **Nuxt**. Framework-agnostic transition lifecycle with framework-specific adapters.

## Packages

| Package | Description |
|---------|-------------|
| [`@flyva/shared`](packages/shared/) | Framework-agnostic core — `PageTransitionManager`, `PageTransition` interface |
| [`@flyva/next`](packages/next/) | Next.js adapter — `FlyvaRoot`, `FlyvaLink`, React composables |
| [`@flyva/nuxt`](packages/nuxt/) | Nuxt module — `FlyvaPage`, `FlyvaLink`, auto-imported composables |

## Quick start

```bash
# Next.js
pnpm add @flyva/next @flyva/shared

# Nuxt
pnpm add @flyva/nuxt @flyva/shared
```

See each package's README for setup instructions or check the [full documentation](docs/).

## Monorepo structure

```
packages/
  shared/     Framework-agnostic transition manager
  next/       Next.js (App Router) adapter
  nuxt/       Nuxt 4 module
playground/
  next/       Next.js test playground
  nuxt/       Nuxt test playground
docs/         VitePress documentation
```

## Development

```bash
pnpm install
pnpm dev:next    # Start Next.js playground
pnpm dev:nuxt    # Start Nuxt playground
pnpm docs:dev    # Start docs dev server
```

## License

MIT — [Owls Department](https://github.com/owlsdepartment)
