/**
 * The Pathfinder acceptance test: regenerate the --ww-* block Pathfinder ships by hand
 * and require every name to resolve and every value to match, both environments.
 *
 *   node dist/proof/pathfinder.js         print the comparison; exit 1 on any gap
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Env } from "@wonder-wagon/tokens";
import { pathfinderSemanticBlock } from "../adapters/pathfinder.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "..", "..", "fixtures", "pathfinder-brand-css.txt");

export interface ProofRow {
  env: Env;
  name: string;
  shipped: string;
  generated: string | undefined;
  ok: boolean;
}

const norm = (v: string) => v.replace(/\s+/g, " ").trim().toLowerCase();

export function proof(fixturePath = FIXTURE): { rows: ProofRow[]; source: string } {
  const text = readFileSync(fixturePath, "utf8");
  const source = (/pathfinder@([0-9a-f]+)/.exec(text)?.[1] ?? "unknown").slice(0, 7);
  const blocks: Record<Env, Record<string, string>> = {
    day: pathfinderSemanticBlock("day"),
    night: pathfinderSemanticBlock("night"),
  };
  const rows: ProofRow[] = [];
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [env, rawName, ...rest] = line.split("\t");
    const name = (rawName ?? "").replace(/^--ww-/, "");
    const shipped = rest.join("\t");
    const generated = blocks[env as Env]?.[name];
    rows.push({
      env: env as Env,
      name,
      shipped,
      generated,
      ok: generated !== undefined && norm(generated) === norm(shipped),
    });
  }
  return { rows, source };
}

function main(): void {
  const { rows, source } = proof();
  const width = Math.max(...rows.map((r) => r.name.length));
  console.log(`Pathfinder regeneration proof — against brand.css at pathfinder@${source}`);
  for (const r of rows) {
    console.log(
      `${r.ok ? "  ok  " : " FAIL "} ${r.env.padEnd(5)} --ww-${r.name.padEnd(width)}  shipped ${r.shipped.padEnd(22)} generated ${r.generated ?? "(missing)"}`,
    );
  }
  const bad = rows.filter((r) => !r.ok);
  console.log(
    `${rows.length} declarations, ${rows.length - bad.length} reproduced, ${bad.length} gaps.`,
  );
  if (bad.length > 0) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
