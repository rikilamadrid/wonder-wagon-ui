import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { detectTerminal } from "../src/cli.js";
import { FAMILY, renderDoorway, renderRoster, WONDER_WAGON } from "../src/doorway.js";

const PACKAGE = fileURLToPath(new URL("..", import.meta.url));
const BIN = fileURLToPath(new URL("../dist/bin.js", import.meta.url));
const { version } = JSON.parse(readFileSync(`${PACKAGE}/package.json`, "utf8")) as {
  version: string;
};
const ESC = "\u001B";
const caps = (columns: number, env: Record<string, string>) =>
  detectTerminal({ env: { LANG: "en_US.UTF-8", ...env }, isTTY: true, columns });
const run = (args: string[], env: Record<string, string> = {}) =>
  spawnSync(process.execPath, [BIN, ...args], {
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "", LANG: "en_US.UTF-8", ...env },
  });

describe("the family doorway", () => {
  it("shows the wagon, the family line, and every sibling with its serial", () => {
    expect(renderDoorway({ version: "0.2.0", caps: caps(80, { NO_COLOR: "1" }) })).toBe(
      [
        "",
        "    ▗▄▄▄▄▄▄▖",
        "    ▐▀▀▜▛▀▀▌    W O N D E R   W A G O N  v0.2.0 · WW-047",
        "  ╲ ▐▄▄▄▄▄▄▌    One family. Different tools.",
        "   ╲▟▀▀▀▀▀▀▙",
        "     ▜▛  ▜▛",
        "",
        "  ━━  Pathfinder  PF-047  npx create-pathfinder",
        "      trail markers for AI-assisted work",
        "",
        "  ✦   Lorekeeper  LK-047  npx create-lorekeeper",
        "      You already wrote it down. Find the passage that answers.",
        "",
        "  ▐█  Forge       FG-047  npm install forge-local-ai-kit",
        "      the Local AI Kit",
        "",
        "  ╱╲  Lama        draft",
        "      Running locally. Built by Lamadrid.",
        "",
        "  Made on Maker 047's bench.",
        "",
        "",
      ].join("\n"),
    );
  });

  it("keeps Lama labelled draft and unpublished", () => {
    const lama = FAMILY.find((member) => member.name === "Lama");
    expect(lama?.serial).toBe("draft");
    expect(lama?.start).toBeUndefined();
    expect(FAMILY.filter((member) => member.serial.endsWith("-047"))).toHaveLength(3);
  });

  it("stacks and wraps inside a narrow terminal without breaking the word gap", () => {
    const narrow = renderDoorway({ version: "0.2.0", caps: caps(40, { NO_COLOR: "1" }) });
    for (const line of narrow.split("\n")) expect([...line].length).toBeLessThanOrEqual(40);
    expect(narrow).toContain("\n  W O N D E R   W A G O N\n  v0.2.0 · WW-047\n");
    expect(narrow).toContain("  ━━  Pathfinder  PF-047\n      npx create-pathfinder\n");
  });

  it("uses the ASCII wagon and glyphs under WW_ASCII without dropping colour", () => {
    const ascii = renderDoorway({
      version: "0.2.0",
      caps: caps(80, { WW_ASCII: "1", COLORTERM: "truecolor" }),
    });
    expect(ascii).toContain(`${ESC}[38;2;`);
    const visible = ascii
      .replaceAll(`${ESC}[0m`, "")
      .replace(/\[[0-9;]*m/g, "")
      .replaceAll(ESC, "");
    expect([...visible].every((character) => character.charCodeAt(0) < 128)).toBe(true);
  });

  it("paints each sibling in its own signal at every depth, and nothing under NO_COLOR", () => {
    expect(
      renderDoorway({ version: "0.2.0", caps: caps(80, { COLORTERM: "truecolor" }) }),
    ).toContain(`${ESC}[38;2;224;97;31m━━`);
    expect(
      renderDoorway({ version: "0.2.0", caps: caps(80, { TERM: "xterm-256color" }) }),
    ).not.toContain(`${ESC}[38;2;`);
    expect(renderDoorway({ version: "0.2.0", caps: caps(80, { NO_COLOR: "1" }) })).not.toContain(
      ESC,
    );
    expect(WONDER_WAGON.serial).toBe("WW-047");
  });
});

describe("npx wonder-wagon-ui", () => {
  it("prints the stable plain roster to a pipe, even when colour is forced", () => {
    const piped = run([], { FORCE_COLOR: "3", COLORTERM: "truecolor" });
    expect(piped.status).toBe(0);
    expect(piped.stderr).toBe("");
    expect(piped.stdout).toBe(renderRoster(version));
    expect(piped.stdout).toBe(
      `Wonder Wagon ${version} WW-047\nOne family. Different tools.\n\n` +
        "Pathfinder  PF-047  npx create-pathfinder\n" +
        "Lorekeeper  LK-047  npx create-lorekeeper\n" +
        "Forge       FG-047  npm install forge-local-ai-kit\n" +
        "Lama        draft\n",
    );
    expect(run(["--help"]).stdout).toBe(piped.stdout);
  });

  it("prints only the version for --version", () => {
    for (const flag of ["--version", "-v"]) {
      const result = run([flag], { FORCE_COLOR: "3" });
      expect(result).toMatchObject({ status: 0, stdout: `${version}\n`, stderr: "" });
    }
  });

  it("refuses unknown arguments on stderr with exit 2 and no identity", () => {
    const result = run(["--json"], { FORCE_COLOR: "3" });
    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe(
      'wonder-wagon-ui: unknown argument "--json"\nUsage: npx wonder-wagon-ui [--help | --version]\n',
    );
  });

  it("exits cleanly when the reader closes the pipe", () => {
    expect(() =>
      execFileSync("/bin/sh", ["-c", `"${process.execPath}" "${BIN}" | head -c 1 >/dev/null`]),
    ).not.toThrow();
  });

  it("stays React-free, dependency-free, and install-silent", () => {
    const manifest = JSON.parse(readFileSync(`${PACKAGE}/package.json`, "utf8"));
    expect(manifest.dependencies ?? {}).toEqual({});
    expect(manifest.peerDependencies ?? {}).toEqual({});
    expect(manifest.scripts.postinstall).toBeUndefined();
    for (const file of ["index.js", "cli.js", "doorway.js", "bin.js"]) {
      const source = readFileSync(`${PACKAGE}/dist/${file}`, "utf8");
      expect(source).not.toMatch(/from\s+["'](?!\.\/|node:)/);
      expect(source).not.toMatch(/(?:from|import)\s*\(?\s*["']react/);
    }
  });
});
