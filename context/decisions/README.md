# Decisions

Approved at the Feature 04 decision gate on 2026-09-23. Source: the Atelier studio's
`context/features/04-wonder-wagon-ui/decision-room.html`.

| # | Decision | Outcome |
|---|---|---|
| D1 | Where identity values live | `packages/themes` holds the values; products own objects, illustrations and generated adapters |
| D2 | Type scale | Seven steps .75–2.25rem, leading 1.6 / 1.25 — approved for v0.1, refinable before 1.0 |
| D3 | Motion easing | throw `cubic-bezier(.2,.7,.2,1)` 180ms · settle `cubic-bezier(.4,0,.2,1)` · detent `steps(12)`; all motion respects reduced motion |
| D4 | Positioning primitive | Floating UI (enters with Tooltip in a later feature) |
| D5 | Lint and format | Biome |
| D6 | Size budgets | Enforced; measurement method documented in `project-overview.md` |
| D7 | The system's serial | `WW-047` |
| D8 | Visual regression | Committed Playwright snapshots are canonical; Chromatic deferred and addable without replacing the baseline |
| D9 | Storybook host | GitHub Pages |
| D10 | Docs domain | Deferred; deploy to the generated Vercel URL; `SITE_URL` attaches a domain later |
| D11 | Art direction | Maker 047's bench — Bench Green, the Reference Case, night workshop / daylight drafting room; silhouette and secondary values get one refinement pass before stable |
| D12 | License | MIT |

## Implementation decisions recorded during Feature 05

- **Vitest 4, not 5.** The official Storybook Vitest addon at 10.6 declares peer support
  for Vitest 3 and 4 only. The repository pins 4.1.11 across all workspaces.
- **Declarations from `tsc -b`.** TypeScript 7 has no JavaScript compiler API, so no
  Vite dts plugin; the library emits `.d.ts` with `tsc` before Vite builds the JavaScript.
- **Token source is TypeScript, not JSON.** One typed source; DTCG JSON is a generated
  output. Discovery had proposed a DTCG source; the typed source gives the same outputs
  plus a type for every consumer.
- **The environment attribute works on any element**, not only the root, so a component
  re-scopes a dark panel without a single literal.
- **Pathfinder's two day surface sets are two roles, not a conflict:** `ground-side` /
  `ground-code` (sidebar, code) and `surface` / `surface-2` (card, panel). Both ship.
- **Forge's shipped identity is absorbed, not replaced** — bronze stays the signal, Ember
  is the ecosystem's enamel. Two questions were put to the human — Forge's Iron ground
  versus Workshop Night, and Ember beside the shipped single-accent budget — and ruled on
  2026-09-23; see below.

## Forge identity rulings

Approved by the human on 2026-09-23 from the Atelier studio's Forge identity decision
specimen (`context/features/05-wonder-wagon-ui-foundation/forge-identity-decision.html`).

| # | Decision | Outcome |
|---|---|---|
| F1 | Night ground | Forge keeps **Iron `#17130D`** as its product-specific night ground, owned through its product theme / adapter. **Workshop Night `#17191C`** remains the Wonder Wagon system night. This is intentional product differentiation, not token drift: product identities must retain meaningful visual character, and Iron is not replaced by Workshop Night for ecosystem uniformity. |
| F2 | Ember and Bronze | **Bronze** remains Forge's single primary visible signal: emphasis, hallmark, CLI identity. **Ember** remains Forge's product enamel — object identity and larger branded surfaces where appropriate — and must not become a competing general-purpose UI accent. Terminal severity keeps terminal-native colours; normal CLI text stays restrained. No Ember decoration enters the current CLI slice. |

Consequences:

- Forge's PR #45 needs no code change for either ruling; the CLI slice uses bronze and the
  terminal's own severity colours only.
- Wonder Wagon system night is **Workshop Night**; Forge product night is **Iron**. The
  theme contract does not yet let a product carry its own night ground, so Forge's site keeps
  Iron on its own until a product night-ground slot enters the contract (Feature 06 work).
- The doc comment in `packages/themes/src/themes/forge.ts` still describes the two questions
  as open. Correcting it is a `packages/` change with a changeset and rides the next theme
  touch; the values it carries are unaffected.

**Forge is the first external Wonder Wagon foundation consumer**: React-free
`@wonder-wagon/tokens` and `@wonder-wagon/themes` integration through a generated terminal
adapter with a drift check, Forge-specific Iron night, Bronze signal, Ember enamel, serial
`FG-047`.
