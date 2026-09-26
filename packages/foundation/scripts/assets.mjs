#!/usr/bin/env node
/**
 * Copy the approved static token and theme assets into the foundation's dist/.
 *
 * `@wonder-wagon/tokens` and `@wonder-wagon/themes` are private workspaces. The
 * published `wonder-wagon-ui` carries only these built CSS/JSON files, byte for
 * byte, under `dist/tokens/` and `dist/themes/`. No JavaScript from either
 * workspace ships, so the package stays dependency-free and exposes no token or
 * theme module API. Build tokens and themes first.
 *
 *   node scripts/assets.mjs          copy the files
 *   node scripts/assets.mjs --check  exit 1 if any copy is missing or differs
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE = join(HERE, "..");
const PACKAGES = join(PACKAGE, "..");

/** Published themes. `lama` is a draft and stays unpublished. */
export const THEMES = ["wonder-wagon", "pathfinder", "forge", "lorekeeper"];

/** Every copied asset: source in a workspace dist/, target in this dist/. */
export const ASSETS = [
  ...["tokens.css", "tokens.unlayered.css", "tokens.dtcg.json"].map((file) => ({
    source: join(PACKAGES, "tokens", "dist", file),
    target: `dist/tokens/${file}`,
  })),
  ...THEMES.flatMap((theme) =>
    [`${theme}.css`, `${theme}.json`].map((file) => ({
      source: join(PACKAGES, "themes", "dist", file),
      target: `dist/themes/${file}`,
    })),
  ),
];

function run(check) {
  const problems = [];
  for (const { source, target } of ASSETS) {
    const out = join(PACKAGE, target);
    if (!existsSync(source)) {
      problems.push(`${source} is missing; build tokens and themes first`);
      continue;
    }
    if (check) {
      if (!existsSync(out)) problems.push(`${target} is missing`);
      else if (!readFileSync(out).equals(readFileSync(source))) problems.push(`${target} is stale`);
      continue;
    }
    mkdirSync(dirname(out), { recursive: true });
    copyFileSync(source, out);
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(`wonder-wagon-ui assets: ${problem}`);
    process.exit(1);
  }
  console.log(`wonder-wagon-ui assets: ${ASSETS.length} files ${check ? "current" : "copied"}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) run(process.argv.includes("--check"));
