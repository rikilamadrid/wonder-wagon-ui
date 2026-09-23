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
