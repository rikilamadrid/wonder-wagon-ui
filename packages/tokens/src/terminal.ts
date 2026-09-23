/**
 * Terminal colour mapping for products that print rather than render.
 *
 * A CLI cannot use a hex value; it can use one of three alphabets, chosen at run
 * time from what the terminal claims: 24-bit, the 256-colour cube, or the eight ANSI
 * colours. This module is pure arithmetic — no `process`, no probing — so a product
 * can generate its palette once, commit it, and stay dependency-free at run time.
 * Pathfinder's CLI theme established the pattern; this makes it reusable.
 */

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export function hexToRgb(hex: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`not a 6-digit hex colour: ${hex}`);
  const n = Number.parseInt(m[1] as string, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const CUBE = [0, 95, 135, 175, 215, 255] as const;

function nearestCubeIndex(v: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  CUBE.forEach((level, i) => {
    const d = Math.abs(level - v);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  });
  return best;
}

/** Nearest index in the xterm 256-colour palette (the 6×6×6 cube plus the 24 greys), by squared RGB distance. */
export function nearestAnsi256(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const ri = nearestCubeIndex(r);
  const gi = nearestCubeIndex(g);
  const bi = nearestCubeIndex(b);
  const cubeIndex = 16 + 36 * ri + 6 * gi + bi;
  const level = (i: number) => CUBE[i] ?? 0;
  const cubeDistance = (level(ri) - r) ** 2 + (level(gi) - g) ** 2 + (level(bi) - b) ** 2;
  // greys: 232..255 are 8 + 10*k
  const avg = Math.round((r + g + b) / 3);
  let k = Math.round((avg - 8) / 10);
  k = Math.min(23, Math.max(0, k));
  const grey = 8 + 10 * k;
  const greyDistance = (grey - r) ** 2 + (grey - g) ** 2 + (grey - b) ** 2;
  return greyDistance < cubeDistance ? 232 + k : cubeIndex;
}

export type Ansi16 = "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white";
const BASIC: ReadonlyArray<{ name: Ansi16; rgb: Rgb; bright: boolean }> = [
  { name: "black", rgb: { r: 0, g: 0, b: 0 }, bright: false },
  { name: "red", rgb: { r: 205, g: 0, b: 0 }, bright: false },
  { name: "green", rgb: { r: 0, g: 205, b: 0 }, bright: false },
  { name: "yellow", rgb: { r: 205, g: 205, b: 0 }, bright: false },
  { name: "blue", rgb: { r: 0, g: 0, b: 238 }, bright: false },
  { name: "magenta", rgb: { r: 205, g: 0, b: 205 }, bright: false },
  { name: "cyan", rgb: { r: 0, g: 205, b: 205 }, bright: false },
  { name: "white", rgb: { r: 229, g: 229, b: 229 }, bright: false },
  { name: "black", rgb: { r: 127, g: 127, b: 127 }, bright: true },
  { name: "red", rgb: { r: 255, g: 0, b: 0 }, bright: true },
  { name: "green", rgb: { r: 0, g: 255, b: 0 }, bright: true },
  { name: "yellow", rgb: { r: 255, g: 255, b: 0 }, bright: true },
  { name: "blue", rgb: { r: 92, g: 92, b: 255 }, bright: true },
  { name: "magenta", rgb: { r: 255, g: 0, b: 255 }, bright: true },
  { name: "cyan", rgb: { r: 0, g: 255, b: 255 }, bright: true },
  { name: "white", rgb: { r: 255, g: 255, b: 255 }, bright: true },
];

/**
 * Nearest of the sixteen ANSI colours by squared RGB distance against the xterm
 * defaults. This is the floor, never the preference: at this depth a brand hue may
 * collide with a severity hue, and the product must carry identity by form and
 * wording as well.
 */
export function nearestAnsi16(hex: string): { name: Ansi16; bright: boolean } {
  const c = hexToRgb(hex);
  let best: { name: Ansi16; rgb: Rgb; bright: boolean } = {
    name: "black",
    rgb: { r: 0, g: 0, b: 0 },
    bright: false,
  };
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of BASIC) {
    const d =
      (candidate.rgb.r - c.r) ** 2 + (candidate.rgb.g - c.g) ** 2 + (candidate.rgb.b - c.b) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
    }
  }
  return { name: best.name, bright: best.bright };
}

const ANSI_CODE: Readonly<Record<Ansi16, number>> = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
};

export interface TerminalPaint {
  readonly hex: string;
  /** SGR foreground sequence at 24-bit depth: the exact value. */
  readonly truecolor: string;
  /** SGR foreground sequence in the 256-colour palette, and the index chosen. */
  readonly ansi256: string;
  readonly ansi256Index: number;
  /** SGR foreground sequence in the 16-colour palette (bold stands in for bright), and the name chosen. */
  readonly ansi16: string;
  readonly ansi16Name: Ansi16;
  readonly ansi16Bright: boolean;
}

/** Every alphabet for one colour, computed once. Deterministic: same hex, same bytes. */
export function terminalPaint(
  hex: string,
  options: { ansi16?: { name: Ansi16; bright: boolean } } = {},
): TerminalPaint {
  const { r, g, b } = hexToRgb(hex);
  const index = nearestAnsi256(hex);
  // The 16-colour floor is arithmetic by default. A product may override it by policy —
  // Pathfinder maps blaze to bold yellow rather than the nearer red so its brand never
  // shares a hue with its `bad` severity. That is a product decision, passed in here.
  const basic = options.ansi16 ?? nearestAnsi16(hex);
  const code = ANSI_CODE[basic.name];
  return {
    hex: hex.toUpperCase(),
    truecolor: `\u001B[38;2;${r};${g};${b}m`,
    ansi256: `\u001B[38;5;${index}m`,
    ansi256Index: index,
    ansi16: basic.bright ? `\u001B[1m\u001B[${code}m` : `\u001B[${code}m`,
    ansi16Name: basic.name,
    ansi16Bright: basic.bright,
  };
}

export const SGR_RESET = "\u001B[0m";
