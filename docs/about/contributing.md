# Contributing

Flyva is created and maintained by the [Owls Department](https://github.com/owlsdepartment) team. We welcome issues, ideas, and pull requests - but please keep in mind that we want to keep the project lean and purposeful, so we can't guarantee that every suggestion will be merged or implemented.

## Local development

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (enabled via corepack)

### Setup

1. Clone the repository

```bash
git clone git@github.com:owlsdepartment/flyva.git
cd flyva
```

2. Enable corepack and install dependencies

```bash
corepack enable
pnpm install
```

### Project structure

The repo is a pnpm monorepo with three packages and two playgrounds:

- `packages/shared` — framework-agnostic core logic
- `packages/nuxt` — Nuxt module
- `packages/next` — Next.js integration
- `playground/nuxt` — Nuxt app for testing
- `playground/next` — Next.js app for testing

### Running the playground

```bash
# Nuxt playground
pnpm dev:nuxt

# Next.js playground
pnpm dev:next
```

Use the playgrounds to test your changes against a real app.

## Commits

Commits must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. A commit message linter will reject non-conforming messages.

```bash
git commit -m "feat(nuxt): add custom transition resolver"
git commit -m "fix(shared): handle missing transition key gracefully"
```

## Pull requests

Work on a separate branch forked from `main`. New changes land exclusively through reviewed pull requests.

Before pushing, the `pre-push` hook will run linters automatically. You can also run them manually:

```bash
pnpm lint
```

## Support us

Flyva is currently fully sponsored and maintained by **Owls Department**. If you would like to sponsor the project, invite us to an event, or feature us in a publication, please reach out at [opensource@owlsdepartment.com](mailto:opensource@owlsdepartment.com).
