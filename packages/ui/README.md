# @wonder-wagon/ui

React components for the Wonder Wagon family. Six in Phase A — `Text`, `Stack`,
`Surface`, `Button`, `Field` + `Input`, `Switch` — each proving one architectural claim.
Components read `@wonder-wagon/tokens`' semantic layer and nothing else; a theme from
`@wonder-wagon/themes` re-skins every one of them by setting variables.

**Experimental. No production consumers yet, and not published.** None of the released
products runs these components: three of the four don't use React, and the one that
does, Lama, is unreleased. The package is published only once a real product adopts it,
as its own package, never as a subpath of the React-free `wonder-wagon-ui`. Until then it
lives in the [Storybook laboratory](https://rikilamadrid.github.io/wonder-wagon-ui/storybook/).

```tsx
import "@wonder-wagon/tokens/css";
import "@wonder-wagon/themes/lama.css";
import "@wonder-wagon/ui/styles.css";
import { Button, Field, Input } from "@wonder-wagon/ui";
```

Styles ship as plain CSS beside ESM — never imported from JavaScript — in cascade
layers `ww.tokens → ww.base → ww.components → ww.theme`. Your own unlayered CSS
always wins. Class names (`ww-button`, `ww-field__hint`) and data attributes
(`data-variant`, `data-ww-env`) are public API under semver.

Two mechanical gates run on every change: **G6** — no material literal in any
component stylesheet; **G7** — quiet components never reach for depth stacks, Plate
type or the accent as a fill.
