# wonder-wagon-ui

Experimental React-free foundations for Wonder Wagon products: the family
doorway, the `wonder-wagon-ui/cli` identity generator, and static design-token
and theme files.

## The family doorway

```sh
npx wonder-wagon-ui
```

This prints the Wonder Wagon mark, `WW-047` and every sibling with its serial and
how to start it. Piped, it prints a plain roster, and `--version` prints only the
version. The package has no install scripts. See [`terminal/`](terminal/README.md).

## Tokens and themes

Static CSS and JSON only. The package exports no token or theme JavaScript.

| Subpath | Contents |
|---|---|
| `wonder-wagon-ui/tokens/tokens.css` | Family tokens as `--ww-*` custom properties, in a cascade layer |
| `wonder-wagon-ui/tokens/tokens.unlayered.css` | The same, without the layer |
| `wonder-wagon-ui/tokens/tokens.dtcg.json` | The tokens in DTCG format |
| `wonder-wagon-ui/themes/<theme>.css` | One product theme's semantic overrides |
| `wonder-wagon-ui/themes/<theme>.json` | That theme's values, status and metadata |

`<theme>` is `wonder-wagon`, `pathfinder`, `forge` or `lorekeeper`. Each file is
listed in the export map explicitly. Theme values can change in any 0.x minor, so
pin an exact version and regenerate anything you commit from them.

## wonder-wagon-ui/cli

Products import `wonder-wagon-ui/cli` only from their build scripts, generate a
self-contained `.ts` or `.mjs` module, commit it, and drift-check it in CI. The
generated runtime has no imports or dependencies.

The shared grammar fixes placement and behavior while each product owns its
mark geometry, name, tagline, serial, and colours. Machine output, pipes, JSON,
and `--version` suppress the identity block. `NO_COLOR` removes SGR bytes;
`WW_ASCII=1` independently selects the ASCII mark for terminals whose ambiguous
glyph widths cannot be trusted.

Pass `layout: "responsive"` (to `renderCliIdentity` or `renderCliIdentityModule`)
for the family's narrow behaviour. The block stays wherever it fits with its
tagline. Anywhere else the mark, wordmark, version/serial and wrapped tagline
stack. The default `fixed` layout keeps the published bytes, including
Pathfinder's frozen one-line fallback.

The 0.x API is experimental. Product geometry remains in the product repository;
this package owns only validation, capability detection, family layout, colour
degradation, and deterministic code generation.

Two terminal limitations are explicit:

- Terminals do not reliably report a light background. Lorekeeper and Forge can
  have low accent contrast there; set `NO_COLOR=1` to remove colour.
- Box-drawing and block glyphs can render double-width under CJK ambiguous-width
  policies. Set `WW_ASCII=1` to select the product's ASCII mark without disabling
  colour.

Generated modules are committed to product repositories and checked for drift.
They contain no imports, so using the generator adds no product runtime dependency.
