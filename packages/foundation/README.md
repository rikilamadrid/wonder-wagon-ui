# wonder-wagon-ui/cli

Experimental React-free CLI identity foundation for Wonder Wagon products.

Products import `wonder-wagon-ui/cli` only from their build scripts, generate a
self-contained `.ts` or `.mjs` module, commit it, and drift-check it in CI. The
generated runtime has no imports or dependencies.

The shared grammar fixes placement and behavior while each product owns its
mark geometry, name, tagline, serial, and colours. Machine output, pipes, JSON,
and `--version` suppress the identity block. `NO_COLOR` removes SGR bytes;
`WW_ASCII=1` independently selects the ASCII mark for terminals whose ambiguous
glyph widths cannot be trusted.

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
