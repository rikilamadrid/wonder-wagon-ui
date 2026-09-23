/**
 * Gate G6 — no material literal in the library.
 * Components read the semantic tier and nothing else. A hex colour, an rgb()/hsl()
 * literal, a material variable, a font-family name or a box-shadow written out by hand
 * would let a component quietly leave the token system.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = join(__dirname, "..", "..", "src");
const cssFiles: string[] = [];
for (const dir of readdirSync(join(src, "components"), { withFileTypes: true })) {
  if (dir.isDirectory()) cssFiles.push(join(src, "components", dir.name, `${dir.name}.css`));
}
cssFiles.push(join(src, "styles", "base.css"));

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("G6 — no material literal in ui CSS", () => {
  it.each(cssFiles.map((f) => [f.replace(src, "src"), f]))("%s", (_label, file) => {
    const css = strip(readFileSync(file, "utf8"));
    expect(css, "hex colour").not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css, "rgb()/hsl() literal").not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch|lab)\(/);
    expect(css, "material variable").not.toMatch(/--ww-m-/);
    for (const decl of css.match(/font-family:[^;]+;/g) ?? []) {
      expect(decl, "font-family must be a token").toMatch(
        /^font-family:\s*var\(--ww-font-[a-z]+\);$/,
      );
    }
    for (const decl of css.match(/box-shadow:[^;]+;/g) ?? []) {
      expect(decl, "box-shadow must reference a depth or semantic token").toMatch(/var\(--ww-/);
    }
    for (const decl of css.match(/\b(transition|animation)(-duration)?:[^;]+;/g) ?? []) {
      if (/\d+m?s\b/.test(decl))
        expect(decl, "durations come from tokens unless reduced-motion 1ms").toMatch(/\b1ms\b/);
    }
  });
});
