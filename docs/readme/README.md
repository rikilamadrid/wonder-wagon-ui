# README assets

Images used by the repository README only. Nothing here ships in a package or the catalog.

| File | What it is | Source |
|---|---|---|
| `header-day.svg` | README header on a light GitHub theme: Quiet Paper ground, ink wordmark | The Reference Case drawing from `apps/storybook/public/brand/reference-case.svg`, unchanged and scaled; colours are material tokens from `packages/tokens/src/tokens.ts` |
| `header-night.svg` | The same header on a dark theme: Workshop Night ground, lamplight wordmark | As above |
| `doorway.svg` | `npx wonder-wagon-ui@0.3.0`, drawn from its bytes | `apps/docs/src/evidence/terminal/wonder-wagon/wide.ansi`, the catalog's PTY capture of the published package |
| `specimen.mjs` | The renderer that draws a recorded `.ansi` capture as a self-grounded SVG | — |

The header text is live `<text>` in Georgia and the system monospace, so it renders in
whatever those faces resolve to on the reader's machine.

`doorway.svg` carries its own Workshop Night panel, so one file reads on light and dark
themes. Block elements are drawn as rectangles on the cell grid, so the pull wagon keeps
its geometry in any monospace font. To regenerate it after the catalog's capture changes:

```sh
node docs/readme/specimen.mjs apps/docs/src/evidence/terminal/wonder-wagon/wide.ansi \
  docs/readme/doorway.svg --ground "#17191C" --fg "#F7F0DF" \
  --title "npx wonder-wagon-ui@<version>" --label "<full text alternative>"
```

Update the version in the README caption at the same time.
