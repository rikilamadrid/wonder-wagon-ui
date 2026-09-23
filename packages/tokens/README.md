# @wonder-wagon/tokens

The framework-neutral contract every Wonder Wagon product builds on: colour in
two environments, depth stacks, type roles, space, radius, motion, the syntax
palette, and a measured contrast gate. **No React. No runtime.**

```sh
npm install @wonder-wagon/tokens
```

```css
@import "@wonder-wagon/tokens/css";   /* day on :root, night on [data-ww-env="night"] */
```

```ts
import { semanticValues, ratio } from "@wonder-wagon/tokens";
import { terminalPaint } from "@wonder-wagon/tokens/terminal"; // for CLIs
```

Three tiers, referenced one way: **material → semantic → component (later)**.
Components read the semantic tier only. A product theme (`@wonder-wagon/themes`)
overrides six slots — `accent`, `accent-low`, `accent-ink`, `link`, `signal`,
`signal-edge` — plus its enamel and object radius, and nothing else.

`bun run check` regenerates every output in memory, compares it to `dist/`, and
measures every declared pairing with the WCAG 2.x formula. A stale file or a
failing pair fails the build. The record is `dist/CONTRAST.md`.
