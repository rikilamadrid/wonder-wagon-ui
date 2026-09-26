import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ASSETS, THEMES } from "../scripts/assets.mjs";

type Asset = { source: string; target: string };

const PACKAGE = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(PACKAGE, "package.json"), "utf8"));
const assets = ASSETS as Asset[];

describe("static token and theme assets", () => {
  it("publishes only the approved themes", () => {
    expect(THEMES).toEqual(["wonder-wagon", "pathfinder", "forge", "lorekeeper"]);
  });

  it("exports every asset at its own path and nothing else from tokens or themes", () => {
    const exported = Object.keys(manifest.exports).filter((key) =>
      /^\.\/(tokens|themes)\//.test(key),
    );
    expect(exported).toEqual(assets.map(({ target }) => `./${target.slice("dist/".length)}`));
    for (const key of exported) expect(manifest.exports[key]).toBe(`./dist/${key.slice(2)}`);
  });

  it("exposes no token or theme JavaScript, adapter, wildcard or draft surface", () => {
    for (const key of Object.keys(manifest.exports)) {
      expect(key).not.toMatch(/\*|terminal|render|adapters|lama/);
      if (/^\.\/(tokens|themes)\//.test(key)) expect(key).toMatch(/\.(css|json)$/);
    }
    expect(manifest.exports["./tokens"]).toBeUndefined();
    expect(manifest.exports["./themes"]).toBeUndefined();
  });

  it("copies each built workspace file byte for byte", () => {
    for (const { source, target } of assets) {
      expect(readFileSync(join(PACKAGE, target)).equals(readFileSync(source)), target).toBe(true);
    }
  });

  it("ships no draft theme", () => {
    for (const theme of THEMES) {
      const data = JSON.parse(
        readFileSync(join(PACKAGE, "dist", "themes", `${theme}.json`), "utf8"),
      );
      expect(data.id).toBe(theme);
      expect(["pilot", "approved"]).toContain(data.status);
    }
  });

  it("stays dependency-free and keeps CSS side effects", () => {
    for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
      expect(manifest[field]).toBeUndefined();
    }
    expect(manifest.sideEffects).toEqual(["*.css"]);
  });
});
