# History

### 2026-09-23 — Feature 05 (Atelier): foundation build — ACCEPTED

- Outcome: `@wonder-wagon/tokens`, `@wonder-wagon/themes` and `@wonder-wagon/ui` (six
  Phase A components) build from a clean install; the night-workshop Storybook and the
  drafting-room docs build; Forge consumes the foundations without React through a
  generated adapter with a drift check (rikilamadrid/forge#45, open); Pathfinder's shipped
  semantic block regenerates 34/34.
- Verification: `validate` green on `d7b9195` — 66 + 80 contrast pairings, 0 failing;
  40/40 stories with axe; 240/240 visual snapshots in the Playwright reference image;
  budgets 313 B / 1.74 kB / 2.83 kB; publint, attw and Biome clean.
- Release: not published. `release.yml` is gated on the repository variable
  `RELEASE_ENABLED`, which does not exist.
- Pending, human-only: GitHub Pages (Settings → Pages → Source: GitHub Actions, then re-run
  `storybook-pages`), the `wonder-wagon` npm organisation and trusted publishers, the
  Vercel project for `apps/docs`, the two Forge visual rulings.

### 2026-09-27 — Feature 10: Wonder Wagon Catalog — COMPLETE (accepted)

- Outcome: the Astro catalog is the public front door at
  <https://rikilamadrid.github.io/wonder-wagon-ui/> and Storybook stays the experimental
  laboratory at <https://rikilamadrid.github.io/wonder-wagon-ui/storybook/>. One GitHub Pages
  deployment serves both, and old Storybook links forward to `/storybook/`. The four released
  identities (WW-047, PF-047, LK-047, FG-047) are shown from captures of the public packages.
  Integration depth is documented as measured: Pathfinder, semantic site layer and CLI
  identity; Lorekeeper, family chrome and CLI identity; Forge, CLI identity only; Lama, draft
  and unreleased. Forge's provenance is reported as absent (manual release). The React
  components are labelled experimental with no production consumers, and product-owned UI
  stays product-owned.
- Decisions: D13–D15 recorded; D10 superseded (no Vercel project).
- Evidence: committed and reproducible. `evidence.mjs --check` and
  `capture-terminal.py --check` re-read the public record; CI G12 checks every file against
  its manifest offline.
- Verification: `validate` green on the merge, including the catalog job: 88 Playwright tests
  (axe on every page, day and night, desktop and phone; 30 visual baselines; deep-link
  forwarding), and every internal link resolves. On the live site, 40 page loads returned
  200 with 0 axe violations.
- Merged: #13 `8778305` (evidence foundation); #14 `1776f81` (catalog, unified Pages deploy,
  tests, honesty corrections).
- Unchanged: no product repository, npm package, terminal identity or release workflow.
- Maturity: about 50% overall. The catalog and documentation layer is about 85%; broader
  theme and component adoption is intentionally incomplete.
