# @wonder-wagon/ui

React components for the Wonder Wagon family. Six in Phase A — `Text`, `Stack`,
`Surface`, `Button`, `Field` + `Input`, `Switch` — each proving one architectural claim.
Components read `@wonder-wagon/tokens`' semantic layer and nothing else; a theme from
`@wonder-wagon/themes` re-skins every one of them by setting variables.

```sh
npm install @wonder-wagon/ui @wonder-wagon/tokens @wonder-wagon/themes react react-dom
```

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
