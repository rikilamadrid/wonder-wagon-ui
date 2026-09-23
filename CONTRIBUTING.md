# Contributing

Branch off `main`, open a pull request, squash merge, delete the branch. Conventional
Commits. Every change under `packages/` needs a changeset (`bun run changeset`) unless the
pull request carries the `no-release` label.

Before pushing: `bun run build && bun run check && bun run test`, and for component work
`cd apps/storybook && bun run test` (every story in a browser with axe) and `bun run visual`
(snapshots; update only deliberately with `bun run visual:update`, never on `main`).

Two rules that are tests, not requests: a component stylesheet carries no material literal
(G6), and a component annotated `@ww-tier quiet` uses no depth stacks, plate type or accent
fill (G7). A product's hero object never enters `packages/ui`.
