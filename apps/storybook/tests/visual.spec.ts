import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * One screenshot per story per environment per theme-of-record. Stories are read from the
 * built index so a new story is covered the moment it exists; a story can opt out with the
 * `no-visual` tag. Docs pages are not snapshotted.
 */
interface IndexEntry {
  id: string;
  type: string;
  tags?: string[];
  title: string;
  name: string;
}
const index = JSON.parse(
  readFileSync(new URL("../storybook-static/index.json", import.meta.url), "utf8"),
) as { entries: Record<string, IndexEntry> };
const stories = Object.values(index.entries).filter(
  (e) => e.type === "story" && !(e.tags ?? []).includes("no-visual"),
);

const ENVS = ["day", "night"] as const;
const THEMES = ["wonder-wagon", "forge"] as const;

for (const story of stories) {
  for (const env of ENVS) {
    for (const theme of THEMES) {
      // Forge only under night, where its CLI lives; the bench under both.
      if (theme === "forge" && env === "day") continue;
      test(`${story.id} · ${env} · ${theme}`, async ({ page }) => {
        await page.goto(
          `/iframe.html?id=${story.id}&viewMode=story&globals=env:${env};product:${theme};ground:stage`,
        );
        await page.waitForSelector(".sb-tray__specimen *", { state: "attached" });
        await page.waitForTimeout(150);
        await expect(page).toHaveScreenshot(`${story.id}--${env}--${theme}.png`, {
          fullPage: true,
        });
      });
    }
  }
}
