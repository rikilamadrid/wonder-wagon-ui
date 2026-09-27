import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, type Page, test } from "@playwright/test";

const BASE = "/wonder-wagon-ui/";
const PAGES = [
  ["overview", ""],
  ["themes", "themes/"],
  ["products", "products/"],
  ["pathfinder", "products/pathfinder/"],
  ["lorekeeper", "products/lorekeeper/"],
  ["forge", "products/forge/"],
  ["terminal", "terminal/"],
  ["patterns", "patterns/"],
  ["accessibility", "accessibility/"],
  ["evidence", "evidence/"],
  ["not-found", "404.html"],
] as const;
const ENVS = ["day", "night"] as const;
const NIGHT_VISUAL = new Set(["overview", "themes", "terminal", "pathfinder"]);
const axeSource = readFileSync(
  createRequire(import.meta.url).resolve("axe-core/axe.min.js"),
  "utf8",
);

async function open(page: Page, path: string, env: "day" | "night") {
  await page.addInitScript((value) => localStorage.setItem("ww-catalog-env", value), env);
  await page.goto(BASE + path);
  await expect(page.locator("html")).toHaveAttribute("data-ww-env", env);
  // Lazy screenshots below the fold load before anything is measured or compared.
  await page.evaluate(async () => {
    const images = [...document.images];
    for (const img of images) img.loading = "eager";
    await Promise.all(images.map((img) => (img.complete ? null : img.decode().catch(() => null))));
    for (const details of document.querySelectorAll("details")) details.open = false;
  });
}

for (const [name, path] of PAGES) {
  for (const env of ENVS) {
    test(`${name} · ${env} · axe is clean and nothing overflows`, async ({ page }) => {
      await open(page, path, env);
      await page.addScriptTag({ content: axeSource });
      const result = await page.evaluate(() =>
        // biome-ignore lint/suspicious/noExplicitAny: axe is injected at run time
        (window as any).axe.run(document, { resultTypes: ["violations"] }),
      );
      const violations = result.violations.map(
        (v: { id: string; nodes: { target: string[] }[] }) =>
          `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      );
      expect(violations).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    // Night is compared where it changes the design; axe above checks night on every page.
    if (env === "night" && !NIGHT_VISUAL.has(name)) continue;
    test(`${name} · ${env} · visual`, async ({ page }) => {
      await open(page, path, env);
      // The embedded site screenshots are evidence files with their own hash check; masking
      // them keeps these baselines about the catalog's layout, not the products' pages.
      await expect(page).toHaveScreenshot(`${name}-${env}.png`, {
        fullPage: true,
        mask: [page.locator(".shot img")],
        maskColor: "#8C7454",
      });
    });
  }
}

test("the environment toggle sets, remembers and releases the choice", async ({ page }) => {
  await page.goto(BASE);
  await expect(page.locator("html")).toHaveAttribute("data-ww-env", "auto");
  await page.getByRole("button", { name: "Night" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-ww-env", "night");
  await expect(page.getByRole("button", { name: "Night" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-ww-env", "night");
  await page.getByRole("button", { name: "Auto" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-ww-env", "auto");
});

test.describe("old Storybook links keep working", () => {
  test("a docs deep link moves under /storybook/ with its query", async ({ page }) => {
    await page.goto(`${BASE}?path=/docs/foundations-color--docs`);
    await expect(page).toHaveURL(`${BASE}storybook/?path=/docs/foundations-color--docs`);
    await expect(
      page.frameLocator("#storybook-preview-iframe").locator("#storybook-docs h1").first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("an index.html deep link moves under /storybook/", async ({ page }) => {
    await page.goto(`${BASE}index.html?path=/docs/workshop-welcome--docs`);
    await expect(page).toHaveURL(`${BASE}storybook/?path=/docs/workshop-welcome--docs`);
  });

  test("a story deep link moves under /storybook/", async ({ page }) => {
    await page.goto(`${BASE}?path=/story/controls-button--signature`);
    await expect(page).toHaveURL(`${BASE}storybook/?path=/story/controls-button--signature`);
  });

  test("the old preview frame URL forwards with its query", async ({ page }) => {
    await page.goto(`${BASE}iframe.html?id=controls-button--signature&viewMode=story`);
    await expect(page).toHaveURL(
      `${BASE}storybook/iframe.html?id=controls-button--signature&viewMode=story`,
    );
    await expect(page.locator("#storybook-root")).toBeAttached();
  });

  test("the catalog root without a Storybook query stays the catalog", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveURL(BASE);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "One family. Different tools.",
    );
  });
});

test("every primary link leads to a page that answers", async ({ page }) => {
  await page.goto(BASE);
  const hrefs = await page
    .locator("nav.primary a")
    .evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
  expect(hrefs.length).toBe(8);
  for (const href of hrefs) {
    const response = await page.request.get(href);
    expect(response.status(), href).toBe(200);
  }
});
