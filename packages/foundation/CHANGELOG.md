# wonder-wagon-ui

## 0.2.0

### Minor Changes

- [#7](https://github.com/rikilamadrid/wonder-wagon-ui/pull/7) [`5e6a1c4`](https://github.com/rikilamadrid/wonder-wagon-ui/commit/5e6a1c418e23e6dcf62418fbf49bba0e92bfd6af) Thanks [@rikilamadrid](https://github.com/rikilamadrid)! - Publish the Wonder Wagon design tokens and product themes as static CSS and JSON
  subpaths: `wonder-wagon-ui/tokens/tokens.css`, `tokens.unlayered.css` and
  `tokens.dtcg.json`, plus `wonder-wagon-ui/themes/<theme>.css` and `<theme>.json`
  for `wonder-wagon`, `pathfinder`, `forge` and `lorekeeper`. Each file is copied
  byte for byte from the private tokens and themes builds. No token or theme
  JavaScript is exported, the package stays dependency-free, and `sideEffects` is
  now `["*.css"]` so bundlers keep CSS imports. `wonder-wagon-ui/cli` is unchanged.

### Patch Changes

- [#1](https://github.com/rikilamadrid/wonder-wagon-ui/pull/1) [`ae94049`](https://github.com/rikilamadrid/wonder-wagon-ui/commit/ae940492ddce1419ba29f0d04b468a042004a06a) Thanks [@rikilamadrid](https://github.com/rikilamadrid)! - Promote the Lorekeeper theme from `draft` to `pilot`. At night the signature fill is now
  Lorekeeper's own periwinkle `#99A2F0` under dark ink `#141521` (7.58:1), as Lorekeeper's
  shipped night button fills; enamel stays Reliquary Indigo `#5D64C3` as the object colour.
  Two CSS values change in `wonder-wagon-ui/themes/lorekeeper.css` night; no export, variable
  name or type changes. Every value the theme restates from Lorekeeper's `tokens.json` is
  now proven against a pinned fixture (`proof:lorekeeper`, in `check`).

## 0.1.0

### Minor Changes

- [#2](https://github.com/rikilamadrid/wonder-wagon-ui/pull/2) [`2381be9`](https://github.com/rikilamadrid/wonder-wagon-ui/commit/2381be9fdfe2e2e84132134cf8335485d9b95967) Thanks [@rikilamadrid](https://github.com/rikilamadrid)! - Add the experimental React-free `wonder-wagon-ui/cli` foundation. It validates
  product-owned terminal marks, detects contract/plain/expressive capabilities,
  renders the shared family grammar across 24/8/4/0 colour depths, supports
  `NO_COLOR` and `WW_ASCII=1`, and generates dependency-free committed modules.
