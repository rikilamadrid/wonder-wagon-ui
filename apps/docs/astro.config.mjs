// @ts-check
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// The deployed origin. D10 deferred the custom domain: the site initially answers at its
// generated Vercel URL, which Vercel exposes at build time. A custom domain later means
// setting SITE_URL once; nothing else in the site knows the host.
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:4321");

export default defineConfig({
  site,
  output: "static",
  integrations: [react()],
  vite: { server: { fs: { allow: ["../.."] } } },
});
