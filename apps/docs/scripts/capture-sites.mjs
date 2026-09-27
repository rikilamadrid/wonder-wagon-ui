#!/usr/bin/env node
/**
 * Screenshots of the live public product sites, for the catalog's product pages.
 *
 * Run in the repository's reference renderer so fonts and Chromium match CI:
 *
 *   docker run --rm -v "$PWD:/work" -w /work mcr.microsoft.com/playwright:v1.63.0-noble \
 *     node apps/docs/scripts/capture-sites.mjs
 *
 * Each site is opened at a fixed viewport in a fresh context with the colour scheme set
 * (the sites follow the system scheme on a first visit), reduced motion on, and nothing
 * stored. The image is the viewport only: no browser chrome, no scrolling. Lama has no
 * public site and is never captured.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "src", "evidence", "sites");
const evidence = JSON.parse(
  readFileSync(join(HERE, "..", "src", "evidence", "evidence.json"), "utf8"),
);

const DEVICES = [
  {
    name: "desktop",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
  },
  { name: "mobile", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true },
];
const SCHEMES = [
  { name: "day", colorScheme: "light" },
  { name: "night", colorScheme: "dark" },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const shots = [];
for (const product of evidence.products.filter((p) => p.site)) {
  for (const device of DEVICES) {
    for (const scheme of SCHEMES) {
      const context = await browser.newContext({
        viewport: device.viewport,
        deviceScaleFactor: device.deviceScaleFactor,
        isMobile: device.isMobile,
        hasTouch: device.isMobile,
        colorScheme: scheme.colorScheme,
        reducedMotion: "reduce",
        locale: "en-US",
        timezoneId: "UTC",
      });
      const page = await context.newPage();
      const response = await page.goto(product.site, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      const file = `${product.id}-${scheme.name}-${device.name}.png`;
      const image = await page.screenshot({ animations: "disabled", caret: "hide" });
      writeFileSync(join(OUT, file), image);
      shots.push({
        product: product.id,
        url: product.site,
        status: response?.status() ?? null,
        env: scheme.name,
        device: device.name,
        viewport: device.viewport,
        deviceScaleFactor: device.deviceScaleFactor,
        file,
        sha256: createHash("sha256").update(image).digest("hex"),
      });
      await context.close();
      console.log(`capture-sites: ${file}`);
    }
  }
}
await browser.close();

writeFileSync(
  join(OUT, "manifest.json"),
  `${JSON.stringify(
    {
      about:
        "Viewport screenshots of the live public product sites: fresh browser context, colour scheme emulated, reduced motion, no browser chrome. Rendered in mcr.microsoft.com/playwright:v1.63.0-noble.",
      capturedOn: new Date().toISOString().slice(0, 10),
      shots,
    },
    null,
    2,
  )}\n`,
);
