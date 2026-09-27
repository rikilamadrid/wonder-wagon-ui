import { defineConfig, devices } from "@playwright/test";

// The catalog's browser gates, run against the assembled Pages artifact (`bun run pages`),
// served at the same /wonder-wagon-ui/ path GitHub Pages uses. Visual baselines come from
// the repository's reference renderer, mcr.microsoft.com/playwright:v1.63.0-noble, exactly
// like the Storybook snapshots (D8).
export default defineConfig({
  testDir: "./tests",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: "disabled" } },
  use: {
    baseURL: "http://127.0.0.1:6008",
    ...devices["Desktop Chrome"],
    reducedMotion: "reduce",
  },
  webServer: {
    command: "node node_modules/http-server/bin/http-server .site -p 6008 -s -c-1",
    url: "http://127.0.0.1:6008/wonder-wagon-ui/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    {
      name: "phone",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
});
