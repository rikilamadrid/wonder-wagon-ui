/**
 * Pathfinder consumes tokens by regeneration, not at run time: its docs site is
 * Starlight, its renderer is dependency-free and byte-deterministic, and its kit is
 * copied into other people's repositories. This adapter produces the `--ww-*`
 * declarations that `site/src/styles/brand.css` carries by hand today, so the
 * migration feature can replace the hand-written block with a generated one and
 * `--check` it in CI. Starlight's own `--sl-*` assignments stay Pathfinder's.
 */
import type { Env } from "@wonder-wagon/tokens";
import { resolveSemantic } from "../contract.js";
import { pathfinder } from "../themes/pathfinder.js";

/** The names Pathfinder's brand.css declares today, in its order. */
export const PATHFINDER_BRAND_NAMES = [
  "ground",
  "ground-side",
  "ground-code",
  "ink",
  "ink-muted",
  "hairline",
  "hairline-shade",
  "signal",
  "link",
  "accent",
  "accent-low",
  "focus",
  "metal",
  "well",
  "well-shade",
  "well-light",
  "signal-edge",
] as const;

export function pathfinderSemanticBlock(env: Env): Record<string, string> {
  const all = resolveSemantic(pathfinder, env);
  const out: Record<string, string> = {};
  for (const name of PATHFINDER_BRAND_NAMES) {
    const v = all[name];
    if (v === undefined) throw new Error(`token missing for Pathfinder name: ${name}`);
    out[name] = v;
  }
  return out;
}

/** The two blocks as brand.css writes them: night on :root (Starlight's default), day on the light theme. */
export function renderPathfinderBrandBlocks(): string {
  const render = (selector: string, env: Env, label: string) =>
    [
      `${selector} {`,
      `  /* ---- Wonder Wagon semantic layer: ${label} — generated from @wonder-wagon/themes/pathfinder ---- */`,
      ...Object.entries(pathfinderSemanticBlock(env)).map(([n, v]) => `  --ww-${n}: ${v};`),
      "}",
    ].join("\n");
  return `${render(":root", "night", "night")}\n\n${render(":root[data-theme='light']", "day", "day")}\n`;
}
