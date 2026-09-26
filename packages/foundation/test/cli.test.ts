import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  type CliProduct,
  detectTerminal,
  renderCliIdentity,
  renderCliIdentityModule,
} from "../src/cli.js";

const ESC = "\u001B";
const pathfinder: CliProduct = {
  name: "Pathfinder",
  serial: "PF-047",
  tagline: "trail markers for AI-assisted work",
  accent: "#E0611F",
  ansi16: {
    accent: { name: "yellow", bright: true },
    allowSeverityCollision: true,
  },
  mark: {
    width: 9,
    nameRow: 1,
    rows: [
      { expressive: [{ text: "   ━━━", role: "accent" }], plain: "   ===" },
      { expressive: [{ text: "  ━━━━━", role: "accent" }], plain: "  =====" },
      { expressive: [{ text: " ━━━━━━━", role: "accent" }], plain: " =======" },
      { expressive: [{ text: "━━━━━━━━━", role: "accent" }], plain: "=========" },
    ],
  },
};

const folders: string[] = [];
afterEach(() => {
  while (folders.length > 0) rmSync(folders.pop() as string, { recursive: true, force: true });
});

describe("terminal detection", () => {
  it("keeps contract, presentation, colour depth, glyph alphabet, and width independent", () => {
    expect(
      detectTerminal({
        env: { LANG: "en_US.UTF-8", FORCE_COLOR: "3" },
        isTTY: false,
        columns: 120,
      }),
    ).toEqual({ tier: "contract", depth: 24, unicode: true, columns: 120 });
    expect(
      detectTerminal({
        env: { LANG: "en_US.UTF-8", NO_COLOR: "1", COLORTERM: "truecolor" },
        isTTY: true,
      }),
    ).toEqual({ tier: "plain", depth: 0, unicode: true, columns: 80 });
    expect(
      detectTerminal({
        env: { LANG: "en_US.UTF-8", WW_ASCII: "1", COLORTERM: "truecolor" },
        isTTY: true,
        columns: 42,
      }),
    ).toEqual({ tier: "plain", depth: 24, unicode: false, columns: 42 });
  });

  it("uses the approved refusal order", () => {
    expect(detectTerminal({ env: { FORCE_COLOR: "3", NO_COLOR: "" }, isTTY: true }).depth).toBe(0);
    expect(detectTerminal({ env: { FORCE_COLOR: "3", TERM: "dumb" }, isTTY: true }).depth).toBe(0);
    expect(detectTerminal({ env: { FORCE_COLOR: "2" }, isTTY: true }).depth).toBe(8);
    expect(detectTerminal({ env: { TERM: "xterm-256color", LANG: "C" }, isTTY: true }).depth).toBe(
      8,
    );
  });
});

describe("Pathfinder 4.4.0 byte proof", () => {
  const render = (env: Record<string, string>, isTTY = true, columns = 80) =>
    renderCliIdentity({
      product: pathfinder,
      version: "4.4.0",
      caps: detectTerminal({ env: { LANG: "en_US.UTF-8", ...env }, isTTY, columns }),
    });

  it("reproduces the shipped truecolor block byte for byte", () => {
    expect(render({ COLORTERM: "truecolor" })).toBe(
      `\n  ${ESC}[38;2;224;97;31m   ━━━${ESC}[0m\n` +
        `  ${ESC}[38;2;224;97;31m  ━━━━━${ESC}[0m      ${ESC}[38;2;224;97;31mP A T H F I N D E R${ESC}[0m  ${ESC}[2mv4.4.0 · PF-047${ESC}[0m\n` +
        `  ${ESC}[38;2;224;97;31m ━━━━━━━${ESC}[0m     ${ESC}[2mtrail markers for AI-assisted work${ESC}[0m\n` +
        `  ${ESC}[38;2;224;97;31m━━━━━━━━━${ESC}[0m\n`,
    );
  });

  it("reproduces the shipped 256- and 16-colour alphabets", () => {
    expect(render({ TERM: "xterm-256color" })).toContain(`${ESC}[38;5;166m`);
    expect(render({ TERM: "xterm" })).toContain(`${ESC}[1m${ESC}[33m`);
    expect(render({ TERM: "xterm-256color" }).replaceAll(`${ESC}[38;5;166m`, "")).not.toContain(
      `${ESC}[38;2;`,
    );
  });

  it("preserves NO_COLOR Unicode bytes and the colour-capable ASCII tier", () => {
    expect(render({ NO_COLOR: "1" })).toBe(
      "\n     ━━━\n    ━━━━━      P A T H F I N D E R  v4.4.0 · PF-047\n" +
        "   ━━━━━━━     trail markers for AI-assisted work\n  ━━━━━━━━━\n",
    );
    expect(render({ COLORTERM: "truecolor", WW_ASCII: "1" })).toBe(
      `\n  ${ESC}[38;2;224;97;31m   ===${ESC}[0m\n` +
        `  ${ESC}[38;2;224;97;31m  =====${ESC}[0m      ${ESC}[38;2;224;97;31mP A T H F I N D E R${ESC}[0m  ${ESC}[2mv4.4.0 - PF-047${ESC}[0m\n` +
        `  ${ESC}[38;2;224;97;31m =======${ESC}[0m     ${ESC}[2mtrail markers for AI-assisted work${ESC}[0m\n` +
        `  ${ESC}[38;2;224;97;31m=========${ESC}[0m\n`,
    );
  });

  it("suppresses contract and machine output and falls to line form when narrow", () => {
    expect(render({ FORCE_COLOR: "3" }, false)).toBe("");
    const caps = detectTerminal({
      env: { LANG: "en_US.UTF-8", COLORTERM: "truecolor" },
      isTTY: true,
      columns: 42,
    });
    const line = renderCliIdentity({ product: pathfinder, version: "4.4.0", caps });
    expect(line).toBe(
      `${ESC}[38;2;224;97;31mP A T H F I N D E R${ESC}[0m  ${ESC}[2mv4.4.0 · PF-047${ESC}[0m`,
    );
    expect(renderCliIdentity({ product: pathfinder, version: "4.4.0", caps, machine: true })).toBe(
      "",
    );
  });
});

describe("generated committed modules", () => {
  it("is deterministic, self-contained, and executable", async () => {
    const first = renderCliIdentityModule(pathfinder, { language: "mjs" });
    const second = renderCliIdentityModule(pathfinder, { language: "mjs" });
    expect(first).toBe(second);
    expect(first).not.toMatch(/^import /m);
    expect(first).not.toMatch(/20\d\d-\d\d-\d\d/);

    const folder = mkdtempSync(join(tmpdir(), "ww-cli-"));
    folders.push(folder);
    const file = join(folder, "identity.mjs");
    writeFileSync(file, first);
    const generated = await import(`${pathToFileURL(file).href}?${Date.now()}`);
    const caps = generated.detectTerminal({
      env: { LANG: "en_US.UTF-8", COLORTERM: "truecolor" },
      isTTY: true,
      columns: 80,
    });
    expect(generated.renderCliIdentity({ version: "4.4.0", caps })).toBe(
      renderCliIdentity({ product: pathfinder, version: "4.4.0", caps }),
    );
  });

  it("rejects a severity collision without the approved product waiver", () => {
    const unsafe: CliProduct = {
      ...pathfinder,
      ansi16: { accent: { name: "yellow", bright: true } },
    };
    expect(() => renderCliIdentityModule(unsafe, { language: "ts" })).toThrow(
      /approved per-product waiver/,
    );
  });

  it("rejects wide mark glyphs while retaining the approved ambiguous set", () => {
    const wide: CliProduct = {
      ...pathfinder,
      mark: {
        ...pathfinder.mark,
        rows: [
          ...pathfinder.mark.rows.slice(0, 3),
          { expressive: [{ text: "界", role: "accent" }], plain: "=" },
        ],
      },
    };
    expect(() => renderCliIdentityModule(wide, { language: "ts" })).toThrow(
      /non-single-cell glyph/,
    );
    expect(() => renderCliIdentityModule(pathfinder, { language: "ts" })).not.toThrow();
  });
});
