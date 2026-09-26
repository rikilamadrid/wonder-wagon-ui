---
"wonder-wagon-ui": patch
---

Promote the Lorekeeper theme from `draft` to `pilot`. At night the signature fill is now
Lorekeeper's own periwinkle `#99A2F0` under dark ink `#141521` (7.58:1), as Lorekeeper's
shipped night button fills; enamel stays Reliquary Indigo `#5D64C3` as the object colour.
Two CSS values change in `wonder-wagon-ui/themes/lorekeeper.css` night; no export, variable
name or type changes. Every value the theme restates from Lorekeeper's `tokens.json` is
now proven against a pinned fixture (`proof:lorekeeper`, in `check`).
