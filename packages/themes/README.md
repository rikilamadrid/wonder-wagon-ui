# @wonder-wagon/themes

The identity mapping each Wonder Wagon product applies over `@wonder-wagon/tokens`:
its enamel, six semantic slots, an object radius set and a serial. Five themes —
`wonder-wagon` (the system itself), `pathfinder`, `forge`, `lorekeeper`, `lama` —
as CSS, JSON and typed data. **No React.**

```css
@import "@wonder-wagon/tokens/css";
@import "@wonder-wagon/themes/forge.css";   /* @layer ww.theme overrides */
```

Products that cannot import at run time regenerate instead:

- `@wonder-wagon/themes/adapters/pathfinder` renders the `--ww-*` block Pathfinder's
  Starlight adapter carries; `bun run proof:pathfinder` proves it reproduces the
  shipped block at a pinned commit.
- `@wonder-wagon/themes/adapters/terminal` renders a dependency-free module a CLI
  commits: one identity colour in 24-bit, 256 and 16-colour alphabets, and severity
  left to the terminal's own colours.

`bun run check` validates every theme against the contract and measures each pairing.
