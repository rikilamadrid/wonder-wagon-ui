#!/usr/bin/env node
/**
 * Assemble the one GitHub Pages artifact: the catalog at the root, the Storybook laboratory
 * under storybook/. Both must already be built.
 *
 *   node apps/docs/scripts/assemble-pages.mjs    → apps/docs/.site/wonder-wagon-ui/
 *
 * The extra path segment mirrors the project-site base, so a plain static server at
 * .site/ serves exactly the URLs GitHub Pages will. The workflow uploads the inner folder.
 */
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = join(APP, "dist");
const lab = join(APP, "..", "storybook", "storybook-static");
const out = join(APP, ".site", "wonder-wagon-ui");

for (const [name, dir] of [
  ["catalog", catalog],
  ["storybook", lab],
]) {
  if (!existsSync(join(dir, "index.html"))) {
    console.error(`assemble-pages: ${name} is not built (${dir})`);
    process.exit(1);
  }
}
rmSync(join(APP, ".site"), { recursive: true, force: true });
cpSync(catalog, out, { recursive: true });
cpSync(lab, join(out, "storybook"), { recursive: true });
console.log(`assemble-pages: ${out}`);
