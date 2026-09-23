import { describe, expect, it } from "vitest";
import {
  pathfinderSemanticBlock,
  renderPathfinderBrandBlocks,
} from "../src/adapters/pathfinder.js";
import { renderTerminalModule, terminalIdentity } from "../src/adapters/terminal.js";
import { allFindings, outputs } from "../src/build.js";
import { resolveSemantic, validateTheme } from "../src/contract.js";
import { themes } from "../src/index.js";
import { proof } from "../src/proof/pathfinder.js";
import { renderThemeCss } from "../src/render.js";

describe("the contract", () => {
  it("every theme validates with no failing pairing", () => {
    expect(allFindings().filter((f) => !f.passes)).toEqual([]);
  });
  it("rejects a theme that sets a value it may not", () => {
    expect(() => validateTheme({ ...themes.forge, serial: "FORGE" })).toThrow(/two capitals/);
    expect(() => validateTheme({ ...themes.forge, radiusObject: "6px" })).toThrow(/four-value/);
    expect(() =>
      validateTheme({ ...themes.forge, signal: { day: "red", night: "#C8973F" } }),
    ).toThrow(/hex/);
  });
  it("a theme only touches the six slots and the enamel", () => {
    const base = resolveSemantic(themes["wonder-wagon"], "day");
    const pf = resolveSemantic(themes.pathfinder, "day");
    const changed = Object.keys(base)
      .filter((k) => base[k] !== pf[k])
      .sort();
    expect(changed).toEqual(["accent", "accent-low", "link", "signal"]);
  });
});

describe("the Pathfinder proof", () => {
  it("reproduces every shipped --ww-* declaration in both environments", () => {
    const { rows } = proof();
    expect(rows.length).toBe(34);
    expect(rows.filter((r) => !r.ok)).toEqual([]);
  });
  it("renders the block in brand.css's own shape, night on :root", () => {
    const css = renderPathfinderBrandBlocks();
    expect(css).toMatch(/^:root \{\n[\s\S]*--ww-ground: #17191C;/);
    expect(css).toContain(":root[data-theme='light'] {");
    expect(pathfinderSemanticBlock("day")["signal-edge"]).toBe("#553316");
  });
});

describe("terminal adapter", () => {
  it("gives Forge bronze in three alphabets and never a brand severity", () => {
    const id = terminalIdentity(themes.forge);
    expect(id.serial).toBe("FG-047");
    expect(id.brand.hex).toBe("#C8973F");
    expect(id.brand.truecolor).toBe("\u001B[38;2;200;151;63m");
    expect(id.severity).toEqual({ ok: "green", info: "cyan", warn: "yellow", bad: "red" });
  });
  it("renders a deterministic module with no dates", () => {
    const a = renderTerminalModule(themes.forge, { packageVersion: "0.1.0" });
    const b = renderTerminalModule(themes.forge, { packageVersion: "0.1.0" });
    expect(a).toBe(b);
    expect(a).not.toMatch(/20\d\d-\d\d-\d\d/);
    expect(a).toContain('export const SERIAL = "FG-047";');
  });
});

describe("outputs", () => {
  it("are deterministic and layered", () => {
    expect(outputs()).toEqual(outputs());
    expect(renderThemeCss(themes.forge)).toMatch(/^@layer ww\.theme \{/);
  });
});
