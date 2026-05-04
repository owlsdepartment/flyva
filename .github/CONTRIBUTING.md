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

### End-to-end tests (Playwright)

`@playwright/test` lives in **`packages/next`** and **`packages/nuxt`**, not the repo root. After `pnpm install`, download browsers once (shared cache for both packages):

```bash
pnpm playwright:install
```

If you prefer the long form: `pnpm --filter @flyva/next exec playwright install` (either package works). Then `pnpm test` / `pnpm test:e2e` can launch Chromium.

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

## npm releases (OIDC)

Maintainers publish **`@flyva/shared`**, **`@flyva/next`**, and **`@flyva/nuxt`** with **npm Trusted Publishers** and the [`publish-npm.yml`](./workflows/publish-npm.yml) workflow (triggered on **`v*` tags**, when a **GitHub Release** is published, or via **workflow_dispatch**).

One-time setup on [npmjs.com](https://www.npmjs.com/):

1. For **each** published package (`@flyva/shared`, `@flyva/next`, `@flyva/nuxt`), add a **Trusted Publisher** pointing at this repository and the **`publish-npm.yml`** workflow file (optionally restrict to a GitHub Environment). The workflow filename must match exactly, including the `.yml` extension.
2. In the GitHub repository **Settings → Actions → General**, under **Workflow permissions**, allow **Read and write** where required, and ensure **OIDC** is enabled for GitHub Actions (no long-lived `NPM_TOKEN` secret is needed when Trusted Publishing is configured).

The workflow installs dependencies with **pnpm**, then runs **`npm publish`** (not `pnpm publish`) with **`--provenance`**. Trusted publishing is implemented in the **npm CLI** (11.5.1+); using `npm publish` from each `packages/*` directory avoids OIDC failures that can show up as **404** when going through `pnpm publish`.
