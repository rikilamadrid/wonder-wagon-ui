/**
 * The Lorekeeper acceptance test: every value the lorekeeper theme restates from
 * Lorekeeper's brand/tokens/tokens.json must match the token in the pinned fixture.
 * Lorekeeper's own brand/terminal check runs the same mapping the other way.
 *
 *   node dist/proof/lorekeeper.js         print the comparison; exit 1 on any gap
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Env } from "@wonder-wagon/tokens";
import type { ProductTheme } from "../contract.js";
import { lorekeeper } from "../themes/lorekeeper.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "..", "..", "fixtures", "lorekeeper-tokens.txt");

type Field = "enamel" | "accent" | "accentInk" | "link" | "signal";

/**
 * Theme field and environment → Lorekeeper token. Night enamel (#5D64C3) is absent on
 * purpose: Feature 02 assigned it and Lorekeeper has no token for it. accentLow and
 * radiusObject are Wonder Wagon's own.
 */
export const LOREKEEPER_MAP: ReadonlyArray<readonly [Field, Env, string]> = [
  ["enamel", "day", "light.accent"],
  ["accent", "day", "light.accent"],
  ["accent", "night", "dark.accent"],
  ["accentInk", "day", "light.accent-ink"],
  ["accentInk", "night", "dark.accent-ink"],
  ["link", "day", "light.accent"],
  ["link", "night", "dark.accent"],
  ["signal", "day", "light.gold"],
  ["signal", "night", "dark.gold"],
];

export interface ProofRow {
  field: Field;
  env: Env;
  token: string;
  shipped: string | undefined;
  theme: string;
  ok: boolean;
}

export function proof(
  fixturePath = FIXTURE,
  theme: ProductTheme = lorekeeper,
): { rows: ProofRow[]; source: string } {
  const text = readFileSync(fixturePath, "utf8");
  const source = (/lorekeeper@([0-9a-f]+)/.exec(text)?.[1] ?? "unknown").slice(0, 7);
  const tokens = new Map<string, string>();
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [env, name, value] = line.split("\t");
    tokens.set(`${env}.${name}`, (value ?? "").trim());
  }
  const rows = LOREKEEPER_MAP.map(([field, env, token]) => {
    const shipped = tokens.get(token);
    const value = theme[field][env];
    return {
      field,
      env,
      token,
      shipped,
      theme: value,
      ok: shipped !== undefined && shipped.toLowerCase() === value.toLowerCase(),
    };
  });
  return { rows, source };
}

function main(): void {
  const { rows, source } = proof();
  console.log(`Lorekeeper source proof — against tokens.json at lorekeeper@${source}`);
  for (const r of rows) {
    console.log(
      `${r.ok ? "  ok  " : " FAIL "} ${r.env.padEnd(5)} ${r.field.padEnd(9)} ← ${r.token.padEnd(16)} shipped ${(r.shipped ?? "(missing)").padEnd(8)} theme ${r.theme}`,
    );
  }
  const bad = rows.filter((r) => !r.ok);
  console.log(`${rows.length} values, ${rows.length - bad.length} match, ${bad.length} gaps.`);
  if (bad.length > 0) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
