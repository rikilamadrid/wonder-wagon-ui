/**
 * Everything the catalog says about the family, read from committed evidence. Nothing here
 * reaches the network; the scripts in ../../scripts refresh these files and check them.
 */
import { type ProductTheme, themes } from "@wonder-wagon/themes";
import evidence from "../evidence/evidence.json";
import sites from "../evidence/sites/manifest.json";
import terminal from "../evidence/terminal/manifest.json";

export type Evidence = typeof evidence;
export type Released = Evidence["products"][number];
export type ProductId = "wonder-wagon" | "pathfinder" | "lorekeeper" | "forge";

export { evidence, sites, terminal };

export const released = evidence.products as Released[];
export const products = released.filter((p) => p.id !== "wonder-wagon");
export const system = released.find((p) => p.id === "wonder-wagon") as Released;
export const drafts = evidence.drafts;

export const byId = (id: string) => released.find((p) => p.id === id) as Released;
export const themeOf = (id: string) => themes[id as keyof typeof themes] as ProductTheme;

/** Resolve a site path against the Pages base. Every internal link goes through here. */
export function url(path = ""): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const clean = path.replace(/^\//, "");
  if (!clean) return `${base}/`;
  if (clean.includes("#") || clean.includes("?") || /\.[a-z0-9]+$/i.test(clean))
    return `${base}/${clean}`;
  return `${base}/${clean.replace(/\/?$/, "/")}`;
}

export const storybook = (path = "") => url(`storybook/${path}`);

export function date(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const short = (sha: string) => sha.slice(0, 7);

/** The order the family is always presented in. */
export const ORDER: ProductId[] = ["wonder-wagon", "pathfinder", "lorekeeper", "forge"];

/** What a product's integration depth means, from deepest to none. */
export const DEPTH = {
  source: { rank: 4, label: "The source" },
  semantic: { rank: 3, label: "Semantic site layer + CLI identity" },
  chrome: { rank: 2, label: "Family chrome layer + CLI identity" },
  terminal: { rank: 1, label: "CLI identity only" },
  none: { rank: 0, label: "Consumes nothing yet" },
} as const;

/**
 * How deep each product goes, one row per consumer. Every "measured" cell restates a
 * number from evidence.json; the words around it are the curated claim.
 */
export type State = "yes" | "partial" | "no";
export interface Cell {
  readonly state: State;
  readonly text: string;
}
export const COLUMNS = [
  "Terminal identity",
  "Theme in the contract",
  "Website",
  "React components",
] as const;

function measured(id: string, file: string) {
  return byId(id).integration.measured.find((m) => m.file.endsWith(file))?.value as unknown;
}

export function depthRow(id: "pathfinder" | "lorekeeper" | "forge" | "lama"): Cell[] {
  if (id === "lama") {
    return [
      { state: "no", text: "Draft specimen only" },
      { state: "no", text: "Draft theme; does not match the app yet" },
      { state: "no", text: "No public site" },
      { state: "no", text: "Not adopted" },
    ];
  }
  const theme = themeOf(id);
  const identity = {
    state: "yes" as const,
    text: `Generated module · pin ${byId(id).generator.version}`,
  };
  const contract = {
    state: theme.status === "approved" ? ("yes" as const) : ("partial" as const),
    text: theme.status === "approved" ? "Approved · proven against the shipped site" : "Pilot",
  };
  const react = { state: "no" as const, text: "None" };
  if (id === "pathfinder") {
    const n = measured(id, "brand.css") as number;
    return [
      identity,
      contract,
      { state: "yes", text: `Semantic layer · ${n} --ww-* declarations` },
      react,
    ];
  }
  if (id === "lorekeeper") {
    const v = measured(id, "site.css") as { product: number; family: number };
    return [
      identity,
      contract,
      {
        state: "partial",
        text: `Family chrome only · ${v.family} of ${v.family + v.product} var() references`,
      },
      react,
    ];
  }
  const n = measured(id, "forge.css") as number;
  return [
    identity,
    contract,
    { state: "no", text: `Product-owned · ${n} --ww-* references` },
    react,
  ];
}

export function captureFor(product: string, tier: string) {
  return terminal.captures.find((c) => c.product === product && c.tier === tier);
}

export const TIER_LABEL: Record<string, string> = {
  wide: "Truecolor · 100 columns",
  narrow: "Truecolor · 40 columns",
  ansi256: "256 colours",
  "no-color": "NO_COLOR=1",
  ascii: "WW_ASCII=1",
  dumb: "TERM=dumb",
  piped: "Piped · no terminal",
};
