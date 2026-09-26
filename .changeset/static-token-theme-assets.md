---
"wonder-wagon-ui": minor
---

Publish the Wonder Wagon design tokens and product themes as static CSS and JSON
subpaths: `wonder-wagon-ui/tokens/tokens.css`, `tokens.unlayered.css` and
`tokens.dtcg.json`, plus `wonder-wagon-ui/themes/<theme>.css` and `<theme>.json`
for `wonder-wagon`, `pathfinder`, `forge` and `lorekeeper`. Each file is copied
byte for byte from the private tokens and themes builds. No token or theme
JavaScript is exported, the package stays dependency-free, and `sideEffects` is
now `["*.css"]` so bundlers keep CSS imports. `wonder-wagon-ui/cli` is unchanged.
