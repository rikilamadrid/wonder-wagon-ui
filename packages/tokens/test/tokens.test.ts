import { describe, expect, it } from "vitest";
import { measureAll, outputs } from "../src/build.js";
import { ratio } from "../src/contrast.js";
import { renderTokensCss, semanticValues } from "../src/render.js";
import { nearestAnsi16, nearestAnsi256, terminalPaint } from "../src/terminal.js";
import { material, semanticColor, wonderWagonDefaults } from "../src/tokens.js";

describe("contrast arithmetic reproduces the shipped measurements", () => {
  // Fixtures from Pathfinder assets/README.md and brand.css comments, and the Atelier Feature 02 record.
  it.each([
    ["#E0611F", "#FBF3DE", 3.22],
    ["#E0611F", "#F5DCA6", 2.66],
    ["#E0611F", "#17191C", 4.95],
    ["#FFF2A8", "#F5DCA6", 1.18],
    ["#FFF2A8", "#17191C", 15.53],
    ["#A96E2D", "#F5DCA6", 3.16],
    ["#A96E2D", "#FBF3DE", 3.83],
    ["#A96E2D", "#17191C", 4.16],
    ["#6E5740", "#FBF3DE", 6.12],
    ["#F7F0DF", "#17191C", 15.5],
    ["#2A160D", "#FBF3DE", 15.57],
    ["#8A6212", "#343A8C", 1.8],
  ])("%s on %s is %s", (fg, bg, expected) => {
    expect(Math.round(ratio(fg, bg) * 100) / 100).toBe(expected);
  });
});

describe("the gate", () => {
  it("measures every declared pairing in both environments and none fails", () => {
    const rows = measureAll();
    expect(rows.length).toBeGreaterThan(40);
    expect(rows.filter((r) => !r.passes)).toEqual([]);
  });
  it("is deterministic", () => {
    expect(outputs()).toEqual(outputs());
  });
});

describe("the semantic layer", () => {
  it("switches every environment-dependent role", () => {
    const day = semanticValues("day");
    const night = semanticValues("night");
    expect(day.ground).toBe(material.quiet);
    expect(night.ground).toBe(material.night);
    expect(day.focus).toBe(material.ink);
    expect(night.focus).toBe("#FFF2A8");
    expect(Object.keys(day)).toEqual(Object.keys(night));
  });
  it("fills the theme slots with the Wonder Wagon defaults", () => {
    expect(semanticValues("night").accent).toBe(wonderWagonDefaults.accent.night);
  });
  it("keeps metal constant across environments", () => {
    expect(semanticColor.metal.value.day).toBe(semanticColor.metal.value.night);
  });
});

describe("css rendering", () => {
  const css = renderTokensCss({ layer: true });
  it("puts day on :root and night on the env attribute and the auto media query", () => {
    expect(css).toMatch(/:root, \[data-ww-env="day"\] \{[\s\S]*--ww-ground: #FBF3DE;/);
    expect(css).toMatch(/\[data-ww-env="night"\] \{[\s\S]*--ww-ground: #17191C;/);
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*\[data-ww-env="auto"\]/);
  });
  it("declares the cascade layers up front", () => {
    expect(css.startsWith("@layer ww.tokens, ww.base, ww.components, ww.theme;")).toBe(true);
  });
  it("ships depth stacks whole", () => {
    expect(css).toContain(
      "--ww-depth-recess-object: inset 0 1px 0 rgb(255 250 240 / 0.22), inset 0 12px 26px",
    );
  });
});

describe("terminal mapping", () => {
  it("reproduces Pathfinder's blaze mapping at 24-bit and 256 colours", () => {
    expect(nearestAnsi256("#E0611F")).toBe(166);
    const p = terminalPaint("#E0611F");
    expect(p.truecolor).toBe("\u001B[38;2;224;97;31m");
    expect(p.ansi256).toBe("\u001B[38;5;166m");
  });
  it("answers the 16-colour floor arithmetically and lets a product override it by policy", () => {
    // Blaze is nearer red than yellow by squared distance; Pathfinder chose bold yellow so the
    // brand never shares a hue with `bad`. Bronze lands on yellow without any policy.
    expect(nearestAnsi16("#E0611F")).toEqual({ name: "red", bright: false });
    expect(nearestAnsi16("#C8973F")).toEqual({ name: "yellow", bright: false });
    expect(terminalPaint("#E0611F", { ansi16: { name: "yellow", bright: true } }).ansi16).toBe(
      "\u001B[1m\u001B[33m",
    );
  });
  it("prefers the grey ramp for greys", () => {
    expect(nearestAnsi256("#808080")).toBeGreaterThanOrEqual(232);
  });
});
