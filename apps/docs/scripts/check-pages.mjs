#!/usr/bin/env node
/**
 * Validate the assembled Pages artifact before it is uploaded.
 *
 * - the files the site promises exist: catalog pages, 404, the Storybook entry, its index,
 *   and the old-link shim;
 * - every internal link and asset in every catalog page resolves to a file in the artifact;
 * - no page links outside the /wonder-wagon-ui/ base by accident.
 * External links are listed, not fetched, so CI never depends on the network; pass
 * --external to fetch each one as well.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", ".site", "wonder-wagon-ui");
const BASE = "/wonder-wagon-ui/";
const REQUIRED = [
  "index.html",
  "404.html",
  "iframe.html",
  "themes/index.html",
  "products/index.html",
  "products/pathfinder/index.html",
  "products/lorekeeper/index.html",
  "products/forge/index.html",
  "terminal/index.html",
  "patterns/index.html",
  "accessibility/index.html",
  "evidence/index.html",
  "storybook/index.html",
  "storybook/iframe.html",
  "storybook/index.json",
];

const problems = [];
for (const file of REQUIRED) if (!existsSync(join(ROOT, file))) problems.push(`missing ${file}`);

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (relative(ROOT, path) !== "storybook") yield* pages(path);
    } else if (name.endsWith(".html")) yield path;
  }
}

function resolves(pathname) {
  const target = join(ROOT, decodeURIComponent(pathname.slice(BASE.length)));
  if (existsSync(target) && statSync(target).isFile()) return true;
  return existsSync(join(target, "index.html")) || existsSync(`${target.replace(/\/$/, "")}.html`);
}

const external = new Set();
let checked = 0;
for (const page of pages(ROOT)) {
  const html = readFileSync(page, "utf8");
  const pageUrl = new URL(
    `https://pages.test${BASE}${relative(ROOT, page).replace(/index\.html$/, "")}`,
  );
  for (const [, ref] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    if (ref.startsWith("#") || ref.startsWith("data:") || ref.startsWith("mailto:")) continue;
    const url = new URL(ref.replaceAll("&amp;", "&"), pageUrl);
    // The site's own absolute URLs (canonical, og:url) are checked as internal paths.
    if (url.host === "rikilamadrid.github.io") url.host = "pages.test";
    if (url.host !== "pages.test") {
      external.add(url.origin + url.pathname);
      continue;
    }
    checked++;
    if (!url.pathname.startsWith(BASE))
      problems.push(`${relative(ROOT, page)}: outside the base: ${ref}`);
    else if (!resolves(url.pathname)) problems.push(`${relative(ROOT, page)}: broken: ${ref}`);
  }
}
const index = JSON.parse(readFileSync(join(ROOT, "storybook", "index.json"), "utf8"));
const stories = Object.keys(index.entries ?? {}).length;
if (stories === 0) problems.push("storybook/index.json lists no stories");

if (process.argv.includes("--external")) {
  for (const href of [...external].sort()) {
    const response = await fetch(href, { method: "GET", redirect: "follow" }).catch((e) => ({
      ok: false,
      status: e.message,
    }));
    // npmjs.com answers scripted requests with 403; the registry facts are checked by evidence.mjs.
    if (response.status === 403 && href.startsWith("https://www.npmjs.com/")) continue;
    if (!response.ok) problems.push(`external ${response.status}: ${href}`);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(
  `check-pages: ${REQUIRED.length} required files, ${checked} internal links resolve, ${stories} Storybook entries, ${external.size} external URLs (not fetched)`,
);
