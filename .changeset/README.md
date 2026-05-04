# Changesets (Flyva)

Published packages **`@flyva/shared`**, **`@flyva/next`**, and **`@flyva/nuxt`** are in a **fixed** group in [`config.json`](./config.json): one bump level applies to all three and they stay on the same version.

Playgrounds and the landing app are listed under **`ignore`** so they never participate in versioning.

Typical flow:

1. `pnpm changeset` — add a changeset (pick the Flyva packages affected; the fixed group surfaces once).
2. Open a PR with the new `.changeset/*.md` file(s).
3. On `main`, `pnpm version-packages` — consumes changesets, bumps `package.json` versions and updates changelogs.
4. Publish to npm via your release process (e.g. GitHub Actions OIDC + tag), not necessarily `changeset publish` in this repo.

Upstream docs: [changesets/changesets](https://github.com/changesets/changesets).
