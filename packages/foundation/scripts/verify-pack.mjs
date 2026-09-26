#!/usr/bin/env node
/**
 * Verify the tarball `npm publish` would upload: exactly the allow-listed files,
 * exactly the approved export map, and no dependencies of any kind.
 *
 *   npm pack --dry-run --json | node scripts/verify-pack.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ASSETS } from "./assets.mjs";

const PACKAGE = join(dirname(fileURLToPath(import.meta.url)), "..");

const output = JSON.parse(readFileSync(0, "utf8"));
// npm 11 returns an array; npm 12 keys reports by package name.
const reports = Array.isArray(output) ? output : Object.values(output);
if (reports.length !== 1 || reports[0]?.name !== "wonder-wagon-ui") {
  throw new Error("expected exactly one wonder-wagon-ui pack report");
}
const [report] = reports;

const expected = [
  "README.md",
  "dist/cli.d.ts",
  "dist/cli.d.ts.map",
  "dist/cli.js",
  "dist/cli.js.map",
  "dist/index.d.ts",
  "dist/index.d.ts.map",
  "dist/index.js",
  "dist/index.js.map",
  "package.json",
  ...ASSETS.map(({ target }) => target),
].sort();
const actual = report.files.map(({ path }) => path).sort();
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(`unexpected tarball files: ${JSON.stringify(actual)}`);
}
if (report.entryCount !== expected.length || report.bundled.length !== 0) {
  throw new Error(`unexpected package shape: ${JSON.stringify(report)}`);
}

const manifest = JSON.parse(readFileSync(join(PACKAGE, "package.json"), "utf8"));
for (const field of [
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "bundleDependencies",
]) {
  if (manifest[field] && Object.keys(manifest[field]).length > 0) {
    throw new Error(`${field} must stay empty`);
  }
}

const exportMap = {
  ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
  "./cli": { types: "./dist/cli.d.ts", default: "./dist/cli.js" },
  ...Object.fromEntries(
    ASSETS.map(({ target }) => [`./${target.slice("dist/".length)}`, `./${target}`]),
  ),
  "./package.json": "./package.json",
};
if (JSON.stringify(manifest.exports) !== JSON.stringify(exportMap)) {
  throw new Error(`unexpected export map: ${JSON.stringify(manifest.exports)}`);
}
if (JSON.stringify(manifest.sideEffects) !== JSON.stringify(["*.css"])) {
  throw new Error('sideEffects must be exactly ["*.css"] so CSS imports are retained');
}

console.log(
  `wonder-wagon-ui pack: ${actual.length} files, ${Object.keys(exportMap).length} exports, no dependencies`,
);
