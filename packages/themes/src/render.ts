import { AUTO_SELECTOR, ENV_SELECTOR, type Env } from "@wonder-wagon/tokens";
import { type ProductTheme, SLOT_KEYS } from "./contract.js";

function block(theme: ProductTheme, env: Env): string[] {
  const lines: string[] = [];
  for (const [key, name] of Object.entries(SLOT_KEYS) as Array<[keyof typeof SLOT_KEYS, string]>) {
    lines.push(`  --ww-${name}: ${theme[key][env]};`);
  }
  lines.push(`  --ww-m-enamel: ${theme.enamel[env]};`);
  return lines;
}

/** The theme as CSS: six slots, the enamel and the object radius, inside `@layer ww.theme`. */
export function renderThemeCss(
  theme: ProductTheme,
  options: { layer: boolean } = { layer: true },
): string {
  const body = [
    `/* @wonder-wagon/themes/${theme.id} — ${theme.name} (${theme.status}). Generated; do not edit. */`,
    `${ENV_SELECTOR.day} {`,
    ...block(theme, "day"),
    `  --ww-radius-object: ${theme.radiusObject};`,
    "}",
    `${ENV_SELECTOR.night} {`,
    ...block(theme, "night"),
    "}",
    "@media (prefers-color-scheme: dark) {",
    `  ${AUTO_SELECTOR} {`,
    ...block(theme, "night").map((l) => `  ${l}`),
    "  }",
    "}",
  ];
  if (!options.layer) return `${body.join("\n")}\n`;
  return `@layer ww.theme {\n${body.map((l) => `  ${l}`).join("\n")}\n}\n`;
}

/** The theme as data, for design tools and generated adapters. */
export function renderThemeJson(theme: ProductTheme): string {
  return `${JSON.stringify(theme, null, 2)}\n`;
}
