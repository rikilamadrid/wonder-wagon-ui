# Wonder Wagon UI

**A tokens-first design system for the Wonder Wagon family of tools.**
The contract is framework-neutral CSS and JSON. React is one consumer of it, beside a
Node CLI and three Astro sites. Four products keep their own identities by filling six
slots. Maker 047's bench, serial `WW-047`.

| Package | What it is | Runtime deps | Version |
|---|---|---|---|
| [`wonder-wagon-ui`](packages/foundation) | React-free foundations. Experimental `wonder-wagon-ui/cli` generates committed, dependency-free terminal identity modules. | none | 0.x (experimental, unpublished) |
| [`@wonder-wagon/tokens`](packages/tokens) | The contract: colour in two environments, depth stacks, type roles, space, radius, motion, syntax palette, contrast gate. CSS · TS · DTCG. | none | 0.1.0 (unpublished) |
| [`@wonder-wagon/themes`](packages/themes) | Five product themes as CSS, JSON and data, with the theme contract and adapters for products that regenerate rather than import. | tokens | 0.1.0 (unpublished) |
| [`@wonder-wagon/ui`](packages/ui) | React 19 components, plain CSS beside ESM. Six in Phase A. | react, tokens (peer) | 0.1.0 (unpublished) |

```
wonder-wagon-ui/cli ──── terminal grammar · capability tiers · committed code generation

@wonder-wagon/tokens ─── the family: grounds · ink · hairlines · focus · depth · space · type
        │
        ├── @wonder-wagon/themes ── accent · link · signal · enamel · radius · serial, per product
        │          │
        │          ├── Pathfinder   regenerates its Starlight --ww-* block     (no React)
        │          ├── Forge        regenerates a terminal identity module      (no React)
        │          └── Lorekeeper   pulls into its own tokens.json              (no React)
        │
        └── @wonder-wagon/ui ────── React components, one consumer among several
                   └── Lama         the application, later
```

## Why tokens first

Of the four products, one runs React. Pathfinder is Astro and a byte-deterministic
renderer with zero dependencies; Forge is a Node CLI with a verified tarball; Lorekeeper
is a kit. A component library positioned as the shared foundation would have served one
product and misdescribed the ecosystem. So the contract is `tokens`, every product
consumes it through the ordinary package boundary — at run time or by regeneration with
a `--check` — and the React library is downstream.

Two proofs are in the repository:

- **Pathfinder** shipped a hand-written semantic block. `bun run --filter @wonder-wagon/themes proof:pathfinder` regenerates all 34 declarations, day and night, and holds them to the shipped values at a pinned commit.
- **Forge**, on a branch in its own repository, takes `@wonder-wagon/themes` as a devDependency, commits a generated `identity.ts` (bronze in three terminal alphabets; severity left to the terminal's own colours) and fails CI if it drifts. No React enters its graph.

## How products keep their identities

A theme fills six slots — `accent`, `accent-low`, `accent-ink`, `link`, `signal`,
`signal-edge` — plus its enamel (day and night), a four-value object radius and a serial,
inside `@layer ww.theme`. It may not touch grounds, ink, hairlines, focus, depth or
space: those are the family. Components read the semantic tier only, and two gates make
that mechanical: no material literal in any component stylesheet; no depth or plate type
in a quiet one. Hero objects — Pathfinder's atlascope, Forge's furnace — stay in their
products. The library ships physics and slots.

## Install

Not yet published. After the first release:

```sh
npm install @wonder-wagon/tokens @wonder-wagon/themes          # any product, no React
npm install @wonder-wagon/ui react react-dom                   # a React product
npm install --save-dev wonder-wagon-ui                         # build-time CLI generator
```

```css
@import "@wonder-wagon/tokens/css";
@import "@wonder-wagon/themes/forge.css";
@import "@wonder-wagon/ui/styles.css";
```

## Browse

- **Storybook — the night workshop.** `bun run storybook`, or the GitHub Pages build once enabled. Every token as a specimen, every component in every state, every story a browser test.
- **Docs — the daylight drafting room.** `bun run docs`, or the Vercel deployment. What the system is, how it was engineered, how to theme a product.

## How it is tested

Types · Biome · tokens and themes regenerate in memory and compare to `dist/` while every
declared pairing is measured with the WCAG 2.x formula (66 + 80 pairings, 0 failing) ·
every story runs in Chromium through the Storybook Vitest addon with axe in error mode ·
keyboard walkthroughs as play functions · committed Playwright snapshots, day and night,
two widths · `publint`, `@arethetypeswrong/cli`, gzipped `size-limit` budgets · generated
exports and generated adapters checked for drift · a changeset for every package change.
The workflows are in [`.github/workflows`](.github/workflows).

## Release

Changesets, independent versions, `0.x` (minor is breaking). Merging "chore: version
packages" publishes through GitHub Actions with npm trusted publishing — OIDC, provenance,
no stored token. See [`context/project-overview.md`](context/project-overview.md).

## Repository

```
apps/docs         Astro + React islands · Vercel
apps/storybook    Storybook 10 · react-vite · addon-vitest · addon-a11y · Playwright visual
packages/tokens   the contract
packages/themes   product themes, contract, adapters, Pathfinder proof
packages/ui       React components
packages/foundation React-free root and experimental cli subpath
context/          project truth and the twelve recorded decisions
```

MIT. Built with Bun workspaces, TypeScript 7, React 19, Vite 8, Storybook 10, Vitest 4,
Playwright, Biome, Changesets.
