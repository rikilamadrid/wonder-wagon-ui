import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import preserveDirectives from "rollup-preserve-directives";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const components = readdirSync(`${root}src/components`, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

// One entry per component plus the barrel, so a consumer's bundler drops what it does
// not import. Styles are not imported from JavaScript; scripts/build-css.mjs ships them.
const entry: Record<string, string> = { index: `${root}src/index.ts` };
for (const name of components) entry[kebab(name)] = `${root}src/components/${name}/index.ts`;

export default defineConfig({
  plugins: [
    react(),
    // "use client" must survive the build for Next.js App Router consumers.
    preserveDirectives(),
    // Declarations come from `tsc -b` (TypeScript 7 has no JS compiler API for a dts plugin).
  ],
  build: {
    lib: { entry, formats: ["es"] },
    sourcemap: true,
    minify: false,
    emptyOutDir: false,
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@wonder-wagon\//],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        // React 19 elides jsx-runtime imports into a shared chunk; keep it named.
        manualChunks(id) {
          if (id.includes("/src/lib/")) return "lib";
          return undefined;
        },
      },
    },
  },
});
