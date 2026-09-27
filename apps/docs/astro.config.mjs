// @ts-check
import { defineConfig } from "astro/config";

// The Wonder Wagon Catalog. One GitHub Pages artifact serves the catalog at the base and
// the Storybook laboratory under it at /storybook/ (decision D13, superseding D10's
// Vercel docs). SITE_URL and BASE_PATH override the Pages origin for a local preview.
export default defineConfig({
  site: process.env.SITE_URL ?? "https://rikilamadrid.github.io",
  base: process.env.BASE_PATH ?? "/wonder-wagon-ui",
  trailingSlash: "always",
  output: "static",
  build: { format: "directory" },
  vite: { server: { fs: { allow: ["../.."] } } },
});
