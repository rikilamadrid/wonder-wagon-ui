/**
 * The Wonder Wagon token source. One file; every other output is generated from it.
 *
 * Three tiers, referenced one way: material → semantic → (component, not yet).
 * Components read the semantic tier and nothing else. A product theme overrides
 * exactly the slots listed in `themeSlots`; everything else is the family.
 *
 * Values marked "shipped" are in production in Pathfinder (main@163e589) or were
 * measured in the Atelier studio's Feature 02. Values marked "proposed" were
 * approved for v0.1 at the Feature 04 decision gate (2026-09-23) and may be refined
 * with implementation evidence before 1.0.
 */

export type Env = "day" | "night";
export interface EnvValue {
  readonly day: string;
  readonly night: string;
}
export type PairKind = "text" | "non-text" | "decorative" | "seam";
export interface Pair {
  /** the semantic colour this one sits on */
  readonly on: string;
  readonly kind: PairKind;
  readonly note?: string;
}
export interface ColorToken {
  readonly value: EnvValue;
  readonly about: string;
  readonly pairs?: readonly Pair[];
}

/** The bar each kind of pairing must clear. `seam` is exempt by rule; `decorative` is measured and reported. */
export const BAR: Readonly<Record<PairKind, number>> = {
  text: 4.5,
  "non-text": 3,
  decorative: 0,
  seam: 0,
};

// ---------------------------------------------------------------------------
// Material tier — things you could hold. Constant across environments except enamel.
// ---------------------------------------------------------------------------
export const material = {
  paper: "#F5DCA6",
  quiet: "#FBF3DE",
  night: "#17191C",
  "night-side": "#1F2226",
  "night-code": "#23272C",
  ink: "#2A160D",
  "ink-muted": "#6E5740",
  lamplight: "#F7F0DF",
  "lamplight-muted": "#CDC2AA",
  brass: "#A96E2D",
  "brass-lit": "#C8863A",
  "brass-shade": "#6E4519",
  "worn-brass": "#E2B26A",
  gilt: "#8A6212",
  edge: "#553316",
  moss: "#3F5A12",
  "moss-pale": "#C5D28E",
  rust: "#8A3609",
  gold: "#F2D98A",
  peach: "#F5C7A6",
  ember: "#F28B6B",
  wine: "#7A2E2E",
} as const;
export type MaterialName = keyof typeof material;

// ---------------------------------------------------------------------------
// Semantic tier — roles. Switch wholesale with the environment.
// Names follow what Pathfinder shipped where the role is the same, so its adapter
// regenerates without renaming anything.
// ---------------------------------------------------------------------------
export const semanticColor = {
  ground: {
    value: { day: material.quiet, night: material.night },
    about: "The page. Quiet Paper by day, Workshop Night after dark.",
  },
  "ground-stage": {
    value: { day: material.paper, night: material.night },
    about:
      "The object stage: Field Paper. Where a hero object or a specimen sits. Never behind body copy.",
  },
  "ground-side": {
    value: { day: "#F9EFD6", night: material["night-side"] },
    about: "A side panel or sidebar ground. Shipped in Pathfinder's site adapter.",
  },
  "ground-code": {
    value: { day: "#F1E3BF", night: material["night-code"] },
    about: "Inline code and code-block ground. Shipped.",
  },
  surface: {
    value: { day: "#FFFBF0", night: material["night-side"] },
    about: "A quiet card lifted off the page. Shipped in Pathfinder's renderer.",
    pairs: [
      {
        on: "ground",
        kind: "decorative",
        note: "a card against the page; the hairline identifies it",
      },
    ],
  },
  "surface-2": {
    value: { day: "#F6EDD2", night: material["night-code"] },
    about: "A recessed quiet panel: objectives box, code frame, panel fill. Shipped.",
  },
  ink: {
    value: { day: material.ink, night: material.lamplight },
    about: "Body text. Never on enamel; never on bare metal.",
    pairs: [
      { on: "ground", kind: "text" },
      { on: "ground-side", kind: "text" },
      { on: "surface", kind: "text" },
      { on: "surface-2", kind: "text" },
      { on: "ground-code", kind: "text" },
      { on: "well", kind: "text" },
    ],
  },
  "ink-muted": {
    value: { day: material["ink-muted"], night: material["lamplight-muted"] },
    about:
      "Secondary text, captions, quiet tags. The value shipped twice (site, renderer); Feature 02's darker #5C4227 was not adopted.",
    pairs: [
      { on: "ground", kind: "text" },
      { on: "ground-side", kind: "text" },
      { on: "surface", kind: "text" },
      { on: "surface-2", kind: "text" },
    ],
  },
  hairline: {
    value: { day: "#D9C79C", night: "#33383F" },
    about:
      "Decorative hairline: card borders, dividers. Never the only signal that something is separate.",
    pairs: [{ on: "surface", kind: "decorative" }],
  },
  "hairline-shade": {
    value: { day: "#C9B48A", night: "#3E444C" },
    about: "A slightly darker hairline for a lit edge under a bar or a key. Shipped.",
  },
  "hairline-strong": {
    value: { day: "#8C7454", night: "#8A7E68" },
    about:
      "A boundary that must be perceivable: input borders, control edges. Renderer's --pf-line-strong.",
    pairs: [
      { on: "surface", kind: "non-text" },
      { on: "ground", kind: "non-text" },
    ],
  },
  metal: {
    value: { day: material.brass, night: material.brass },
    about: "Brass. Object boundaries and hardware only; never text, never a ground.",
    pairs: [
      { on: "ground", kind: "non-text" },
      { on: "ground-stage", kind: "non-text" },
    ],
  },
  "metal-lit": {
    value: { day: material["brass-lit"], night: material["brass-lit"] },
    about: "The lit stop of the brass ramp.",
  },
  "metal-shade": {
    value: { day: material["brass-shade"], night: material["brass-shade"] },
    about: "The shaded stop of the brass ramp.",
  },
  worn: {
    value: { day: material["worn-brass"], night: material["worn-brass"] },
    about: "Brass worn bright where a hand has held a thing. Evidence of use; never text.",
  },
  edge: {
    value: { day: material.edge, night: material.edge },
    about: "Engraved lines, dark metal, and the outline a signal needs on paper.",
  },
  focus: {
    value: { day: material.ink, night: "#FFF2A8" },
    about:
      "The focus ring. Follows the ground behind the control: ink on paper, pale in the dark. A dark panel in day re-scopes this locally.",
    pairs: [
      { on: "ground", kind: "non-text" },
      { on: "surface", kind: "non-text" },
      { on: "surface-2", kind: "non-text" },
      { on: "ground-side", kind: "non-text" },
    ],
  },
  well: {
    value: { day: "#FFFAEB", night: material["night-code"] },
    about: "The paper under glass: a quiet recess's floor. Shipped.",
  },
  "well-shade": {
    value: { day: "rgb(85 51 22 / 0.22)", night: "rgb(0 0 0 / 0.55)" },
    about: "The recess's inner shadow along its top edge. Edge-coloured on paper, black at night.",
  },
  "well-light": {
    value: { day: "rgb(255 255 255 / 0.7)", night: "rgb(255 255 255 / 0.06)" },
    about: "The lit lip at the bottom of a recess.",
  },
  "status-ok": {
    value: { day: "#1F6F43", night: "#6FD39B" },
    about: "A passing or verified state. Always beside a word or a shape; never alone.",
    pairs: [
      { on: "surface", kind: "text" },
      { on: "ground", kind: "text" },
    ],
  },
  "status-warn": {
    value: { day: "#7A5A0E", night: material["worn-brass"] },
    about: "A caution. Proposed: Feature 02 named it and never valued it.",
    pairs: [
      { on: "surface", kind: "text" },
      { on: "ground", kind: "text" },
    ],
  },
  "status-no": {
    value: { day: "#A62B1E", night: "#F09085" },
    about: "A failing state. Always beside a word.",
    pairs: [
      { on: "surface", kind: "text" },
      { on: "ground", kind: "text" },
    ],
  },
} as const satisfies Record<string, ColorToken>;
export type SemanticColorName = keyof typeof semanticColor;

/**
 * Slots a product theme must fill. The tokens package ships the Wonder Wagon
 * system's own values as defaults, so an unthemed page is still a Wonder Wagon page.
 */
export const themeSlots = [
  "accent",
  "accent-low",
  "accent-ink",
  "link",
  "signal",
  "signal-edge",
] as const;
export type ThemeSlot = (typeof themeSlots)[number];

export const themeSlotPairs: Readonly<Record<ThemeSlot, readonly Pair[]>> = {
  accent: [
    { on: "ground", kind: "non-text", note: "a filled signature action against the page" },
    { on: "surface", kind: "non-text" },
  ],
  "accent-low": [],
  "accent-ink": [{ on: "accent", kind: "text", note: "the label on a filled accent" }],
  link: [
    { on: "ground", kind: "text" },
    { on: "ground-side", kind: "text" },
    { on: "surface", kind: "text" },
  ],
  signal: [
    {
      on: "ground",
      kind: "non-text",
      note: "the inspection dot or needle; exempt where signal-edge is set for that environment",
    },
  ],
  "signal-edge": [],
};

/** The Wonder Wagon system's own identity — Maker 047's bench. Bench Green, worn brass. */
export const wonderWagonDefaults: Readonly<Record<ThemeSlot, EnvValue>> & {
  enamel: EnvValue;
  radiusObject: string;
  serial: string;
} = {
  accent: { day: "#285A1C", night: "#347A32" },
  "accent-low": { day: "#DCE8C4", night: "#1E3A16" },
  "accent-ink": { day: material.lamplight, night: material.lamplight },
  link: { day: "#285A1C", night: "#8CBF63" },
  signal: { day: material["worn-brass"], night: material["worn-brass"] },
  "signal-edge": { day: material.edge, night: "transparent" },
  enamel: { day: "#285A1C", night: "#347A32" },
  radiusObject: "14px 9px 16px 8px",
  serial: "WW",
};

// ---------------------------------------------------------------------------
// Depth — shipped stacks, never decomposed.
// ---------------------------------------------------------------------------
export const depth = {
  rim: {
    value: "inset 0 1px 0 rgb(255 250 240 / 0.22)",
    about: "The machined top rim every recess and raised control carries.",
  },
  quiet: {
    value: {
      day: "0 1px 2px rgb(42 22 13 / 0.08), 0 8px 24px rgb(42 22 13 / 0.06)",
      night: "0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px rgb(0 0 0 / 0.3)",
    },
    about:
      "The quiet card's shadow. The one permitted ink-tinted shadow, confined to quiet cards; objects cast black.",
  },
  key: {
    value: "0 0 0 1px var(--ww-hairline), 0 1px 0 var(--ww-hairline-shade)",
    about: "The smallest raised thing: a keyboard key or chip.",
  },
  "recess-quiet": {
    value:
      "inset 0 1px 2px var(--ww-well-shade), inset 0 -1px 0 var(--ww-well-light), 0 0 0 1px var(--ww-hairline)",
    about: "A quiet recess: search field, header mark well, switch track.",
  },
  "recess-object": {
    value:
      "inset 0 1px 0 rgb(255 250 240 / 0.22), inset 0 12px 26px rgb(0 0 0 / 0.42), inset 0 5px 11px rgb(0 0 0 / 0.34), inset 5px 0 10px rgb(0 0 0 / 0.24), inset -5px 0 10px rgb(0 0 0 / 0.24), inset 0 -6px 12px rgb(0 0 0 / 0.26), inset 0 0 30px rgb(0 5 15 / 0.14), 0 0 0 2px rgb(0 0 0 / 0.72), 0 2px 4px rgb(0 0 0 / 0.4), 0 10px 18px rgb(0 0 0 / 0.2)",
    about:
      "The ten-layer object well: a live readout, a terminal, anything the system is writing into.",
  },
  "cast-contact": { value: "0 3px 5px rgb(0 0 0 / 0.42)", about: "Cast shadow, contact tier." },
  "cast-mid": { value: "0 12px 22px rgb(0 0 0 / 0.26)", about: "Cast shadow, mid tier." },
  "cast-ambient": { value: "0 24px 38px rgb(0 0 0 / 0.16)", about: "Cast shadow, ambient tier." },
  cast: {
    value:
      "0 3px 5px rgb(0 0 0 / 0.42), 0 12px 22px rgb(0 0 0 / 0.26), 0 24px 38px rgb(0 0 0 / 0.16)",
    about: "All three cast tiers. A raised object uses all three; a quiet card uses none.",
  },
  "raised-rest": {
    value:
      "inset 0 1px 0 rgb(255 250 240 / 0.22), inset 0 -2px 0 rgb(0 0 0 / 0.34), 0 3px 4px rgb(0 0 0 / 0.42), 0 8px 13px rgb(0 0 0 / 0.24)",
    about: "A raised control at rest: rim, bottom dark inset, contact, mid.",
  },
  "raised-hover": {
    value:
      "inset 0 1px 0 rgb(255 250 240 / 0.22), inset 0 -2px 0 rgb(0 0 0 / 0.34), 0 5px 6px rgb(0 0 0 / 0.42), 0 12px 18px rgb(0 0 0 / 0.26)",
    about: "Hover: lifted 2px, shadows extend.",
  },
  "raised-press": {
    value:
      "inset 0 5px 8px rgb(0 0 0 / 0.5), inset 0 1px 0 rgb(255 240 220 / 0.2), 0 1px 2px rgb(0 0 0 / 0.54)",
    about: "Pressed: translated down 2px, the stack inverts to inset.",
  },
  stamp: { value: "3px 4px 0 rgb(0 0 0 / 0.4)", about: "The one hard-edged shadow: a stamp." },
} as const;

// ---------------------------------------------------------------------------
// Type — three roles, no web fonts. Scale approved for v0.1 (D2), pre-1.0.
// ---------------------------------------------------------------------------
export const type = {
  "font-working": {
    value:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    about: "Working: body, UI, documentation, tables. The default.",
  },
  "font-engraved": {
    value: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
    about:
      "Engraved: names and claims. Italic permitted for the world voice. Never a paragraph over three lines.",
  },
  "font-plate": {
    value: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    about: "Plate: labels on objects. Never a sentence.",
  },
  "plate-weight": { value: "800", about: "" },
  "plate-tracking": { value: "0.14em", about: "" },
  "plate-size": { value: "0.6875rem", about: "11px. Plate sits outside the scale." },
  "tag-weight": { value: "700", about: "The quiet tag: Plate's quiet sibling on quiet surfaces." },
  "tag-tracking": { value: "0.1em", about: "" },
  "text--1": { value: "0.75rem", about: "12px — fine print" },
  "text-0": { value: "0.875rem", about: "14px — secondary" },
  "text-1": { value: "1rem", about: "16px — body" },
  "text-2": { value: "1.125rem", about: "18px — lede" },
  "text-3": { value: "1.375rem", about: "22px — section title" },
  "text-4": { value: "clamp(1.5rem, 1.2rem + 1vw, 1.75rem)", about: "28px — page title" },
  "text-5": { value: "clamp(1.875rem, 1.3rem + 2vw, 2.25rem)", about: "36px — display" },
  "leading-body": { value: "1.6", about: "" },
  "leading-tight": { value: "1.25", about: "" },
  "heading-tracking": { value: "-0.01em", about: "" },
  measure: { value: "68ch", about: "The reading measure. Shipped in Pathfinder and Lorekeeper." },
} as const;

export const space = {
  "space-1": "0.25rem",
  "space-2": "0.5rem",
  "space-3": "0.75rem",
  "space-4": "1rem",
  "space-5": "1.5rem",
  "space-6": "2rem",
  "space-7": "3rem",
  "space-8": "4rem",
} as const;
export const size = {
  "size-target": "44px",
  "size-content": "1180px",
  "size-prose": "50rem",
} as const;
export const radius = {
  "radius-xs": "4px",
  "radius-sm": "6px",
  "radius-md": "10px",
  "radius-pill": "999px",
} as const;
export const motion = {
  "motion-throw": "180ms",
  "motion-reveal": "900ms",
  "motion-detent-steps": "12",
  "motion-detent-cycle": "1.8s",
  "ease-throw": "cubic-bezier(0.2, 0.7, 0.2, 1)",
  "ease-settle": "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;
/** Breakpoints cannot be custom properties inside @media; they ship as constants and a documented list. */
export const breakpoints = { sm: "34rem", md: "50rem", lg: "56rem", xl: "74rem" } as const;

/** Syntax palette, verbatim from Pathfinder's site/src/code-themes.mjs. Lowest pair 5.78 by day, 6.32 at night. */
export const code = {
  "code-bg": { day: "#F9EFD6", night: "#23272C" },
  "code-fg": { day: "#2A160D", night: "#F7F0DF" },
  "code-muted": { day: "#6E5740", night: "#B3A78E" },
  "code-keyword": { day: "#9E3F0F", night: "#F0A97E" },
  "code-string": { day: "#3F5A12", night: "#C5D28E" },
  "code-constant": { day: "#6E4519", night: "#E2B26A" },
  "code-fn": { day: "#8A3609", night: "#F2D98A" },
  "code-name": { day: "#553316", night: "#F5C7A6" },
  "code-invalid": { day: "#7A2E2E", night: "#F28B6B" },
} as const satisfies Record<string, EnvValue>;

export const brand = { maker: "047" } as const;
