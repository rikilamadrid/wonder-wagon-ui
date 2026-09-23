import { defineConfig } from "vitest/config";
// The library's own Vitest runs the mechanical gates in Node. Component behaviour is
// tested through the stories, in a real browser, from apps/storybook.
export default defineConfig({
  test: { include: ["test/**/*.test.ts"], environment: "node", name: "gates" },
});
