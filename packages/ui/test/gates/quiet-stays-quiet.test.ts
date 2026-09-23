/**
 * Gate G7 — quiet components stay quiet.
 * A file annotated `@ww-tier quiet` may not reach for raised or cast depth, the object
 * recess, Plate type, or the accent as a fill. Those belong to the physics tier.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const components = join(__dirname, "..", "..", "src", "components");
const files = readdirSync(components, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => join(components, d.name, `${d.name}.css`));

const FORBIDDEN_IN_QUIET = [
  /--ww-depth-raised/,
  /--ww-depth-cast/,
  /--ww-depth-recess-object/,
  /--ww-font-plate/,
  /background(-color)?:\s*var\(--ww-accent\)/,
  /background(-color)?:\s*var\(--ww-m-/,
];

describe("G7 — every component declares a tier and quiet ones stay quiet", () => {
  it.each(files.map((f) => [f.split("/").slice(-2).join("/"), f]))("%s", (_label, file) => {
    const css = readFileSync(file, "utf8");
    const tier = /@ww-tier (quiet|physics)/.exec(css)?.[1];
    expect(tier, "missing @ww-tier annotation").toBeDefined();
    if (tier === "quiet") {
      for (const pattern of FORBIDDEN_IN_QUIET) expect(css).not.toMatch(pattern);
    }
  });
  it("Field, Input and Stack are quiet; Button, Surface, Switch and Text carry physics", () => {
    const tiers = Object.fromEntries(
      files.map((f) => [
        f.split("/").at(-2),
        /@ww-tier (quiet|physics)/.exec(readFileSync(f, "utf8"))?.[1],
      ]),
    );
    expect(tiers).toEqual({
      Button: "physics",
      Field: "quiet",
      Input: "quiet",
      Stack: "quiet",
      Surface: "physics",
      Switch: "physics",
      Text: "physics",
    });
  });
});
