# Project Overview — Wonder Wagon UI

The design system for the Wonder Wagon family of tools: Pathfinder, Forge, Lorekeeper
and Lama. **Tokens first**: `@wonder-wagon/tokens` is the framework-neutral contract;
`@wonder-wagon/themes` maps each product's identity over it; `@wonder-wagon/ui` is the
React implementation and one consumer among several. Non-React products regenerate
adapters from the packages and never install React.

This repository was specified in the Atelier brand studio
(`rikilamadrid/atelier`, `context/features/04-wonder-wagon-ui/` and `05-…`), whose
decision room approved twelve decisions on 2026-09-23. The decisions are recorded in
`context/decisions/`.

## Product

| | |
|---|---|
| Identity | Maker 047's bench: the workshop where the tools are made and the reference objects they are measured against. Bench Green enamel, worn brass signal, the Reference Case. Storybook is the night workshop; the docs are the daylight drafting room. |
| Serial | `WW-047` |
| Rule | Object/quiet split. Components ship physics and slots, never a product's hero object. |

## Technology

Bun workspaces · TypeScript 7 · React 19 · Vite 8 · Storybook 10 (react-vite, addon-vitest,
addon-a11y) · Vitest 4 with Playwright browser mode · Playwright for visual snapshots ·
Biome · Changesets · GitHub Actions · npm trusted publishing (OIDC + provenance) · Vercel
for docs · GitHub Pages for Storybook. Tests run under Node; Bun installs and runs scripts.

## Commands

```
bun install                 install everything
bun run build               tokens → themes → ui
bun run check               typecheck + lint + token/theme gates + Pathfinder proof
bun run test                gates and unit tests (tokens, themes, ui)
bun run storybook           the workshop at :6006
bun run docs                the drafting room at :4321
cd apps/storybook && bun run test      every story as a browser test with axe
cd apps/storybook && bun run visual    Playwright snapshots against the built Storybook
bun run changeset           record a release note
```

## Delivery workflow

Branch off `main` (`feature/NN-name` or a short descriptive name), pull request, squash
merge, delete the branch. Conventional Commits. Every package change adds a changeset;
`no-release` label opts out. Human acceptance is required before merge; CI is the gate,
not the reviewer.

## Release

Semantic Versioning, independent per package, `0.x` until the human declares 1.0: MINOR
is breaking, PATCH is everything else. Changesets opens "chore: version packages";
merging it publishes with npm trusted publishing from `.github/workflows/release.yml`.
No npm token is stored anywhere. The release job is hard-gated on the repository variable
`RELEASE_ENABLED=true`, which the human sets at the release gate; until then a push to
`main` publishes nothing.

## Visual regression

Committed Playwright snapshots are the canonical gate (D8). The reference renderer is
Linux Chromium in CI; baselines under `apps/storybook/tests/__screenshots__` are updated
only by a reviewed commit. Chromatic can be added later as a second reporter without
replacing the repository-owned baseline.

## Size budgets (D6)

Measured by `size-limit` with `@size-limit/preset-small-lib`: JavaScript entries are
bundled with rolldown, tree-shaken to the named `import`, with `react`, `react-dom` and
the JSX runtime ignored, minified, then **brotli-compressed** (the preset's default);
`styles.css` is measured as a file, **gzipped**. First measurement (2026-09-23): Button
313 B, Phase A barrel 1.73 kB, styles.css 2.82 kB — budgets 3 / 12 / 14 kB.
Budgets live in `packages/ui/package.json` under `size-limit` and only ratchet down.

## Human-only actions

GitHub repository settings and branch protection; the `wonder-wagon` npm organisation;
trusted-publisher configuration per package after its first publish; the Vercel project
for `apps/docs` (root directory `apps/docs`, include files outside root); GitHub Pages
enabled for the `storybook-pages` workflow; the docs domain (D10, deferred).
