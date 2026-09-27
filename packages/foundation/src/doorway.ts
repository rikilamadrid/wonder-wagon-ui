/**
 * The family doorway: what `npx wonder-wagon-ui` shows a person. Pure and
 * React-free; `bin.ts` observes the terminal and writes the result.
 */

import {
  type Ansi16Choice,
  type CliProduct,
  dimCliText,
  paintCliText,
  renderCliIdentity,
  type TerminalCaps,
} from "./cli.js";

const accent = (text: string) => ({ text, role: "accent" as const });
const enamel = (text: string) => ({ text, role: "secondary" as const });
const iron = (text: string) => ({ text, role: "dim" as const });

/**
 * The Reference Case riding a pull wagon: Bench Green enamel lid, worn brass
 * latch and handle, blackened-iron chassis, two brass wheels.
 */
export const WONDER_WAGON: CliProduct = {
  name: "Wonder Wagon",
  serial: "WW-047",
  tagline: "One family. Different tools.",
  accent: "#E2B26A",
  secondary: "#8CBF63",
  ansi16: {
    accent: { name: "yellow", bright: false },
    secondary: { name: "green", bright: false },
    allowSeverityCollision: true,
  },
  mark: {
    width: 10,
    nameRow: 1,
    rows: [
      { expressive: [enamel("  ▗▄▄▄▄▄▄▖")], plain: "  .------." },
      {
        expressive: [enamel("  ▐▀▀"), accent("▜▛"), enamel("▀▀▌")],
        plain: "  |==[]==|",
      },
      { expressive: [accent("╲ "), enamel("▐▄▄▄▄▄▄▌")], plain: "\\ |______|" },
      { expressive: [accent(" ╲"), iron("▟▀▀▀▀▀▀▙")], plain: " \\/------\\" },
      { expressive: [accent("   ▜▛  ▜▛")], plain: "   oo  oo" },
    ],
  },
};

export interface FamilyMember {
  readonly name: string;
  /** The product serial, or `draft` for an unapproved identity. */
  readonly serial: string;
  readonly tagline: string;
  /** How a person starts; absent while the product is unpublished. */
  readonly start?: string;
  /** Two cells in the product's own geometry, and the ASCII stand-in. */
  readonly glyph: { readonly unicode: string; readonly ascii: string };
  readonly accent: string;
  readonly ansi16?: Ansi16Choice;
}

/**
 * Each sibling's approved serial, tagline, and signal colour, copied from its
 * own generated identity. Lama stays labelled draft until its identity is approved.
 */
export const FAMILY: ReadonlyArray<FamilyMember> = [
  {
    name: "Pathfinder",
    serial: "PF-047",
    tagline: "trail markers for AI-assisted work",
    start: "npx create-pathfinder",
    glyph: { unicode: "━━", ascii: "==" },
    accent: "#E0611F",
    ansi16: { name: "yellow", bright: true },
  },
  {
    name: "Lorekeeper",
    serial: "LK-047",
    tagline: "You already wrote it down. Find the passage that answers.",
    start: "npx create-lorekeeper",
    glyph: { unicode: "✦ ", ascii: "* " },
    accent: "#E2B45C",
  },
  {
    name: "Forge",
    serial: "FG-047",
    tagline: "the Local AI Kit",
    start: "npm install forge-local-ai-kit",
    glyph: { unicode: "▐█", ascii: "[F" },
    accent: "#C8973F",
    ansi16: { name: "yellow", bright: false },
  },
  {
    name: "Lama",
    serial: "draft",
    tagline: "Running locally. Built by Lamadrid.",
    glyph: { unicode: "╱╲", ascii: "/\\" },
    accent: "#43BD91",
  },
];

const NAME_CELLS = Math.max(...FAMILY.map((member) => member.name.length));
const SERIAL_CELLS = Math.max(...FAMILY.map((member) => member.serial.length));
const SIGN_OFF = "Made on Maker 047's bench.";

function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function member(entry: FamilyMember, caps: TerminalCaps): string[] {
  const glyph = paintCliText(
    caps.unicode ? entry.glyph.unicode : entry.glyph.ascii,
    entry.accent,
    caps,
    entry.ansi16,
  );
  // Pad outside the paint so a trailing gap can be trimmed at every depth.
  const name =
    paintCliText(entry.name, entry.accent, caps, entry.ansi16) +
    " ".repeat(NAME_CELLS - entry.name.length);
  const serial = dimCliText(entry.serial, caps);
  const gap = " ".repeat(SERIAL_CELLS - entry.serial.length);
  const head = `  ${glyph}  ${name}  ${serial}`;
  const headCells = 2 + 2 + 2 + NAME_CELLS + 2 + SERIAL_CELLS;
  const start = entry.start ?? "";
  const lines =
    start && headCells + 2 + start.length <= caps.columns
      ? [`${head}${gap}  ${start}`]
      : [head, ...(start ? [`      ${start}`] : [])];
  const width = Math.max(12, caps.columns - 6);
  for (const line of wrap(entry.tagline, width)) lines.push(`      ${dimCliText(line, caps)}`);
  return lines;
}

/** The doorway a person sees. Contract-tier callers use `renderRoster` instead. */
export function renderDoorway(options: { version: string; caps: TerminalCaps }): string {
  const { version, caps } = options;
  const identity = renderCliIdentity({
    product: WONDER_WAGON,
    version,
    caps,
    layout: "responsive",
  });
  const roster = FAMILY.flatMap((entry, index) =>
    index === 0 ? member(entry, caps) : ["", ...member(entry, caps)],
  );
  return `${identity}\n${roster.join("\n")}\n\n  ${dimCliText(SIGN_OFF, caps)}\n\n`;
}

/** Stable plain text for pipes and files: no identity, no escapes, no wrapping. */
export function renderRoster(version: string): string {
  const rows = FAMILY.map((entry) =>
    [entry.name.padEnd(NAME_CELLS), entry.serial.padEnd(SERIAL_CELLS), entry.start ?? ""]
      .join("  ")
      .trimEnd(),
  );
  return `Wonder Wagon ${version} ${WONDER_WAGON.serial}\n${WONDER_WAGON.tagline}\n\n${rows.join("\n")}\n`;
}
