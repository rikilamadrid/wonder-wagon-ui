#!/usr/bin/env node
/**
 * Offline evidence checks, run on every build. The network checks (`evidence --check`,
 * `capture-terminal.py --check`) re-read the public record; this one proves the committed
 * files are the files the manifests describe, and that the story the catalog tells holds.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "evidence");
const read = (path) => readFileSync(join(DIR, path));
const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");
const problems = [];
const expect = (ok, message) => ok || problems.push(message);

const terminal = JSON.parse(read("terminal/manifest.json"));
for (const c of terminal.captures) {
  const bytes = read(`terminal/${c.file}`);
  expect(
    sha(bytes) === c.sha256 && bytes.length === c.bytes,
    `terminal/${c.file} does not match its manifest`,
  );
  expect(c.exit === 0, `terminal/${c.file} exited ${c.exit}`);
}
const sites = JSON.parse(read("sites/manifest.json"));
for (const s of sites.shots) {
  expect(sha(read(`sites/${s.file}`)) === s.sha256, `sites/${s.file} does not match its manifest`);
  expect(s.status === 200, `sites/${s.file} was captured from HTTP ${s.status}`);
}

const evidence = JSON.parse(read("evidence.json"));
const products = Object.fromEntries(evidence.products.map((p) => [p.id, p]));
for (const id of ["wonder-wagon", "pathfinder", "lorekeeper", "forge"])
  expect(products[id], `evidence lacks ${id}`);
for (const p of evidence.products) {
  const captured = terminal.products.find((t) => t.id === p.id);
  expect(
    captured?.version === p.version,
    `${p.id}: captured ${captured?.version}, evidence ${p.version}`,
  );
  expect(
    captured?.integrity === p.integrity,
    `${p.id}: captured tarball integrity differs from the registry's`,
  );
  if (p.provenance.status === "attested") {
    expect(
      p.provenance.sourceCommit === p.release.commit,
      `${p.id}: provenance commit is not the release commit`,
    );
  }
}
// The catalog says Forge has no provenance. If that ever changes, the copy must change with it.
expect(
  products.forge?.provenance.status === "none",
  "Forge now has provenance: update the catalog's wording",
);
expect(
  evidence.drafts.every((d) => !("version" in d)),
  "a draft must not carry a public version",
);
expect(
  sites.shots.every((s) => s.product !== "lama"),
  "Lama has no public site to capture",
);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(
  `check-evidence: ${terminal.captures.length} captures, ${sites.shots.length} screenshots, ${evidence.products.length} packages consistent`,
);
