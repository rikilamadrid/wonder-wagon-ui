import { defineConfig, devices } from "@playwright/test";

// Visual regression against the built Storybook: Linux Chromium in CI is the reference
// renderer; local runs on another platform compare against the same baselines only when
// run through the CI container (see context/project-overview.md §Visual). Snapshots are
// committed beside this file under __screenshots__.
export default defineConfig({
  testDir: "./tests",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: "disabled" } },
  use: {
    baseURL: "http://127.0.0.1:6007",
    ...devices["Desktop Chrome"],
    colorScheme: "light",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "node node_modules/http-server/bin/http-server storybook-static -p 6007 -s -c-1",
    url: "http://127.0.0.1:6007/index.json",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1184, height: 900 } } },
    { name: "phone", use: { viewport: { width: 390, height: 844 } } },
  ],
});
