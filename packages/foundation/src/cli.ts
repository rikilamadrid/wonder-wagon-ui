/**
 * Wonder Wagon's terminal identity grammar.
 *
 * This module is pure, React-free, and dependency-free. Products use it at
 * build time to generate a self-contained module, commit that artifact, and
 * keep their runtime dependency promises unchanged.
 */

export type TerminalTier = "contract" | "plain" | "expressive";
export type ColorDepth = 0 | 4 | 8 | 24;

export interface TerminalCaps {
  readonly tier: TerminalTier;
  readonly depth: ColorDepth;
  readonly unicode: boolean;
  readonly columns: number;
}

export interface DetectTerminalInput {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly isTTY: boolean;
  readonly columns?: number;
  readonly platform?: string;
}

export type CliRole = "accent" | "secondary" | "dim";

export interface CliMarkSegment {
  readonly text: string;
  readonly role: CliRole;
}

export interface CliMarkRow {
  readonly expressive: ReadonlyArray<CliMarkSegment>;
  readonly plain: string;
}

export interface CliMark {
  readonly rows: ReadonlyArray<CliMarkRow>;
  /** Authored cell width, including intentional indentation. */
  readonly width: number;
  /** Zero-based row beside which the name and version sit. */
  readonly nameRow: number;
}

export type Ansi16Name =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white";

export interface Ansi16Choice {
  readonly name: Ansi16Name;
  readonly bright: boolean;
}

export interface CliProduct {
  readonly name: string;
  readonly serial: `${string}-047`;
  readonly tagline: string;
  readonly mark: CliMark;
  readonly accent: string;
  readonly secondary?: string;
  readonly letterspace?: boolean;
  /**
   * The 16-colour floor is policy, not colour science. A product can choose a
   * stable fallback and explicitly waive a severity-hue collision. Pathfinder
   * and Forge use that approved waiver for ANSI yellow.
   */
  readonly ansi16?: {
    readonly accent?: Ansi16Choice;
    readonly secondary?: Ansi16Choice;
    readonly allowSeverityCollision?: boolean;
  };
}

export interface RenderCliIdentityOptions {
  readonly product: CliProduct;
  readonly version: string;
  readonly caps: TerminalCaps;
  readonly form?: "block" | "line";
  readonly machine?: boolean;
}

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

interface TerminalPaint {
  readonly hex: string;
  readonly truecolor: string;
  readonly ansi256: string;
  readonly ansi256Index: number;
  readonly ansi16: string;
  readonly ansi16Name: Ansi16Name;
  readonly ansi16Bright: boolean;
}

const RESET = "\u001B[0m";
const DIM = "\u001B[2m";
const DEFAULT_COLUMNS = 80;
const SEVERITY_HUES: ReadonlySet<Ansi16Name> = new Set(["red", "green", "yellow", "cyan"]);
const CUBE = [0, 95, 135, 175, 215, 255] as const;
const ANSI_CODE: Readonly<Record<Ansi16Name, number>> = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
};
const ANSI16: ReadonlyArray<{ name: Ansi16Name; rgb: Rgb; bright: boolean }> = [
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

function detectsColor(env: Readonly<Record<string, string | undefined>>, isTTY: boolean): boolean {
  if (env.FORCE_COLOR === "0") return false;
  if (env.NO_COLOR !== undefined) return false;
  if (env.TERM === "dumb") return false;
  if (env.FORCE_COLOR !== undefined) return true;
  return isTTY;
}

function detectsUnicode(
  env: Readonly<Record<string, string | undefined>>,
  platform: string,
): boolean {
  if (env.WW_ASCII === "1") return false;
  if (platform === "win32") {
    return Boolean(env.WT_SESSION) || env.TERM_PROGRAM === "vscode";
  }
  return /utf-?8/i.test(env.LC_ALL || env.LC_CTYPE || env.LANG || "");
}

function detectsDepth(
  env: Readonly<Record<string, string | undefined>>,
  color: boolean,
): ColorDepth {
  if (!color) return 0;
  if (env.FORCE_COLOR === "3") return 24;
  if (env.FORCE_COLOR === "2") return 8;
  if (/^(truecolor|24bit)$/i.test(env.COLORTERM ?? "")) return 24;
  if (/-direct$/i.test(env.TERM ?? "")) return 24;
  if (/256color/i.test(env.TERM ?? "")) return 8;
  return 4;
}

/** Decide terminal capability once, only from what the caller observed. */
export function detectTerminal(input: DetectTerminalInput): TerminalCaps {
  const color = detectsColor(input.env, input.isTTY);
  const unicode = detectsUnicode(input.env, input.platform ?? "linux");
  const depth = detectsDepth(input.env, color);
  const tier: TerminalTier = !input.isTTY ? "contract" : color && unicode ? "expressive" : "plain";
  const columns =
    Number.isInteger(input.columns) && (input.columns ?? 0) > 0
      ? (input.columns as number)
      : DEFAULT_COLUMNS;
  return Object.freeze({ tier, depth, unicode, columns });
}

function hexToRgb(hex: string): Rgb {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`not a 6-digit hex colour: ${hex}`);
  const value = Number.parseInt(match[1] as string, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function nearestCubeIndex(value: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  CUBE.forEach((level, index) => {
    const distance = Math.abs(level - value);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

function nearestAnsi256(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const ri = nearestCubeIndex(r);
  const gi = nearestCubeIndex(g);
  const bi = nearestCubeIndex(b);
  const level = (index: number) => CUBE[index] ?? 0;
  const cubeIndex = 16 + 36 * ri + 6 * gi + bi;
  const cubeDistance = (level(ri) - r) ** 2 + (level(gi) - g) ** 2 + (level(bi) - b) ** 2;
  const average = Math.round((r + g + b) / 3);
  const greyIndex = Math.min(23, Math.max(0, Math.round((average - 8) / 10)));
  const grey = 8 + 10 * greyIndex;
  const greyDistance = (grey - r) ** 2 + (grey - g) ** 2 + (grey - b) ** 2;
  return greyDistance < cubeDistance ? 232 + greyIndex : cubeIndex;
}

function nearestAnsi16(hex: string): Ansi16Choice {
  const color = hexToRgb(hex);
  let answer = ANSI16[0] as (typeof ANSI16)[number];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of ANSI16) {
    const distance =
      (candidate.rgb.r - color.r) ** 2 +
      (candidate.rgb.g - color.g) ** 2 +
      (candidate.rgb.b - color.b) ** 2;
    if (distance < bestDistance) {
      answer = candidate;
      bestDistance = distance;
    }
  }
  return { name: answer.name, bright: answer.bright };
}

function terminalPaint(hex: string, ansi16?: Ansi16Choice): TerminalPaint {
  const rgb = hexToRgb(hex);
  const index = nearestAnsi256(hex);
  const basic = ansi16 ?? nearestAnsi16(hex);
  const code = ANSI_CODE[basic.name];
  return Object.freeze({
    hex: hex.toUpperCase(),
    truecolor: `\u001B[38;2;${rgb.r};${rgb.g};${rgb.b}m`,
    ansi256: `\u001B[38;5;${index}m`,
    ansi256Index: index,
    ansi16: basic.bright ? `\u001B[1m\u001B[${code}m` : `\u001B[${code}m`,
    ansi16Name: basic.name,
    ansi16Bright: basic.bright,
  });
}

function cells(text: string): number {
  return [...text].length;
}

/**
 * Mark geometry is authored in single terminal cells. ASCII is unambiguous;
 * the approved Unicode vocabulary is the box-drawing/block range already used
 * by Pathfinder and Forge plus Lorekeeper's neutral four-point star. The
 * renderer cannot safely accept emoji or known-wide scripts as one cell.
 */
function isApprovedMarkCharacter(character: string): boolean {
  const code = character.codePointAt(0) ?? 0;
  return (code >= 0x20 && code <= 0x7e) || (code >= 0x2500 && code <= 0x259f) || code === 0x2726;
}

function spacedName(product: CliProduct): string {
  return product.letterspace === false ? product.name : [...product.name.toUpperCase()].join(" ");
}

function validateProduct(product: CliProduct): void {
  if (!/^[A-Z]{2}-047$/.test(product.serial)) {
    throw new Error(`serial must be two capitals followed by -047: ${product.serial}`);
  }
  if (product.tagline.length > 60) {
    throw new Error(`tagline must be at most 60 characters: ${product.tagline.length}`);
  }
  if (!Number.isInteger(product.mark.width) || product.mark.width < 1 || product.mark.width > 10) {
    throw new Error(`mark width must be an authored integer from 1 to 10: ${product.mark.width}`);
  }
  if (product.mark.rows.length < 3 || product.mark.rows.length > 5) {
    throw new Error(`mark must have 3 to 5 rows: ${product.mark.rows.length}`);
  }
  if (
    !Number.isInteger(product.mark.nameRow) ||
    product.mark.nameRow < 0 ||
    product.mark.nameRow >= product.mark.rows.length
  ) {
    throw new Error(`nameRow is outside the mark: ${product.mark.nameRow}`);
  }
  for (const row of product.mark.rows) {
    const expressive = row.expressive.map((segment) => segment.text).join("");
    if (cells(expressive) > product.mark.width || row.plain.length > product.mark.width) {
      throw new Error(`mark row exceeds authored width ${product.mark.width}: ${expressive}`);
    }
    if (!/^[\x20-\x7E]*$/.test(row.plain)) {
      throw new Error(`plain mark rows must be ASCII: ${row.plain}`);
    }
    const unsupported = [...expressive].find((character) => !isApprovedMarkCharacter(character));
    if (unsupported !== undefined) {
      throw new Error(
        `expressive mark contains a non-single-cell glyph ${JSON.stringify(unsupported)}; provide an approved box/block glyph or use ASCII`,
      );
    }
  }
  const accent = terminalPaint(product.accent, product.ansi16?.accent);
  if (SEVERITY_HUES.has(accent.ansi16Name) && product.ansi16?.allowSeverityCollision !== true) {
    throw new Error(
      `${product.name}'s accent falls to ANSI ${accent.ansi16Name}, a severity hue; add the approved per-product waiver`,
    );
  }
  if (product.secondary !== undefined) {
    terminalPaint(product.secondary, product.ansi16?.secondary);
  }
}

function paintAtDepth(text: string, paint: TerminalPaint, caps: TerminalCaps): string {
  if (caps.depth === 0 || text === "") return text;
  const open =
    caps.depth === 24 ? paint.truecolor : caps.depth === 8 ? paint.ansi256 : paint.ansi16;
  return `${open}${text}${RESET}`;
}

function dim(text: string, caps: TerminalCaps): string {
  return caps.depth === 0 || text === "" ? text : `${DIM}${text}${RESET}`;
}

function renderWithPaints(
  options: RenderCliIdentityOptions,
  paints: { accent: TerminalPaint; secondary?: TerminalPaint },
): string {
  const { product, version, caps } = options;
  if (options.machine === true || caps.tier === "contract") return "";

  const name = spacedName(product);
  const info = caps.unicode ? "·" : "-";
  const metadata = `v${version} ${info} ${product.serial}`;
  const nameLine = `${paintAtDepth(name, paints.accent, caps)}  ${dim(metadata, caps)}`;
  const lineCells = cells(name) + 2 + cells(metadata);
  const blockCells = 2 + product.mark.width + 4 + lineCells;
  const form = caps.columns < blockCells ? "line" : (options.form ?? "block");
  if (form === "line") return nameLine;

  const textColumn = product.mark.width + 4;
  const lines = product.mark.rows.map((row, index) => {
    const raw = caps.unicode ? row.expressive.map((segment) => segment.text).join("") : row.plain;
    const mark = caps.unicode
      ? row.expressive
          .map((segment) => {
            if (segment.role === "dim") return dim(segment.text, caps);
            if (segment.role === "secondary" && paints.secondary !== undefined) {
              return paintAtDepth(segment.text, paints.secondary, caps);
            }
            return paintAtDepth(segment.text, paints.accent, caps);
          })
          .join("")
      : paintAtDepth(row.plain, paints.accent, caps);
    const padding = " ".repeat(textColumn - cells(raw));
    if (index === product.mark.nameRow) return `  ${mark}${padding}${nameLine}`;
    if (index === product.mark.nameRow + 1) {
      return `  ${mark}${padding}${dim(product.tagline, caps)}`;
    }
    return `  ${mark}`;
  });
  return `\n${lines.join("\n")}\n`;
}

/** Render one identity from authored product geometry and already-decided caps. */
export function renderCliIdentity(options: RenderCliIdentityOptions): string {
  validateProduct(options.product);
  const paints = {
    accent: terminalPaint(options.product.accent, options.product.ansi16?.accent),
    ...(options.product.secondary === undefined
      ? {}
      : {
          secondary: terminalPaint(options.product.secondary, options.product.ansi16?.secondary),
        }),
  };
  return renderWithPaints(options, paints);
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function generatedRuntime(language: "ts" | "mjs"): string {
  const detectSignature =
    language === "ts"
      ? "input: { env: Readonly<Record<string, string | undefined>>; isTTY: boolean; columns?: number; platform?: string }"
      : "input";
  const renderSignature =
    language === "ts"
      ? 'options: { version: string; caps: { tier: "contract" | "plain" | "expressive"; depth: 0 | 4 | 8 | 24; unicode: boolean; columns: number }; form?: "block" | "line"; machine?: boolean }'
      : "options";
  const annotations = language === "ts" ? ": string" : "";
  return `
const RESET = "\\u001B[0m";
const DIM = "\\u001B[2m";
const cells = (text${annotations}) => [...text].length;
const spacedName = () => PRODUCT.letterspace ? [...PRODUCT.name.toUpperCase()].join(" ") : PRODUCT.name;
const paint = (text${annotations}, role${language === "ts" ? ': "accent" | "secondary"' : ""}, caps${language === "ts" ? ": { depth: 0 | 4 | 8 | 24 }" : ""}) => {
  if (caps.depth === 0 || text === "") return text;
  const palette = role === "secondary" && PAINTS.secondary ? PAINTS.secondary : PAINTS.accent;
  const open = caps.depth === 24 ? palette.truecolor : caps.depth === 8 ? palette.ansi256 : palette.ansi16;
  return open + text + RESET;
};
const dim = (text${annotations}, caps${language === "ts" ? ": { depth: 0 | 4 | 8 | 24 }" : ""}) => caps.depth === 0 || text === "" ? text : DIM + text + RESET;

export function detectTerminal(${detectSignature}) {
  const env = input.env;
  const color = env.FORCE_COLOR === "0" || env.NO_COLOR !== undefined || env.TERM === "dumb"
    ? false
    : env.FORCE_COLOR !== undefined ? true : input.isTTY;
  const platform = input.platform ?? "linux";
  const unicode = env.WW_ASCII === "1" ? false : platform === "win32"
    ? Boolean(env.WT_SESSION) || env.TERM_PROGRAM === "vscode"
    : /utf-?8/i.test(env.LC_ALL || env.LC_CTYPE || env.LANG || "");
  const depth = !color ? 0 : env.FORCE_COLOR === "3" ? 24 : env.FORCE_COLOR === "2" ? 8
    : /^(truecolor|24bit)$/i.test(env.COLORTERM ?? "") || /-direct$/i.test(env.TERM ?? "") ? 24
    : /256color/i.test(env.TERM ?? "") ? 8 : 4;
  const tier = !input.isTTY ? "contract" : color && unicode ? "expressive" : "plain";
  const columns = Number.isInteger(input.columns) && (input.columns ?? 0) > 0 ? input.columns${language === "ts" ? " as number" : ""} : 80;
  return Object.freeze({ tier, depth, unicode, columns });
}

export function renderCliIdentity(${renderSignature}) {
  const caps = options.caps;
  if (options.machine === true || caps.tier === "contract") return "";
  const name = spacedName();
  const metadata = "v" + options.version + " " + (caps.unicode ? "·" : "-") + " " + PRODUCT.serial;
  const nameLine = paint(name, "accent", caps) + "  " + dim(metadata, caps);
  const lineCells = cells(name) + 2 + cells(metadata);
  const blockCells = 2 + PRODUCT.mark.width + 4 + lineCells;
  const form = caps.columns < blockCells ? "line" : (options.form ?? "block");
  if (form === "line") return nameLine;
  const textColumn = PRODUCT.mark.width + 4;
  const lines = PRODUCT.mark.rows.map((row, index) => {
    const raw = caps.unicode ? row.expressive.map((segment) => segment.text).join("") : row.plain;
    const mark = caps.unicode ? row.expressive.map((segment) => {
      const role${language === "ts" ? ': "accent" | "secondary" | "dim"' : ""} = segment.role;
      return String(role) === "dim" ? dim(segment.text, caps)
        : paint(segment.text, role === "secondary" && PAINTS.secondary ? "secondary" : "accent", caps);
    }).join("") : paint(row.plain, "accent", caps);
    const padding = " ".repeat(textColumn - cells(raw));
    if (index === PRODUCT.mark.nameRow) return "  " + mark + padding + nameLine;
    if (index === PRODUCT.mark.nameRow + 1) return "  " + mark + padding + dim(PRODUCT.tagline, caps);
    return "  " + mark;
  });
  return "\\n" + lines.join("\\n") + "\\n";
}
`;
}

/** Emit the dependency-free module a product commits and executes at runtime. */
export function renderCliIdentityModule(
  product: CliProduct,
  options: { language: "ts" | "mjs" },
): string {
  validateProduct(product);
  const normalizedProduct = { ...product, letterspace: product.letterspace ?? true };
  const paints = {
    accent: terminalPaint(product.accent, product.ansi16?.accent),
    secondary:
      product.secondary === undefined
        ? null
        : terminalPaint(product.secondary, product.ansi16?.secondary),
  };
  const values = JSON.stringify({ product: normalizedProduct, paints });
  const hash = fnv1a(values);
  const suffix = options.language === "ts" ? " as const" : "";
  return [
    "// GENERATED by wonder-wagon-ui/cli — do not edit.",
    `// Product: ${product.name}; values hash: ${hash}.`,
    "// Generate at build time, commit this file, and verify it with the product's --check script.",
    "",
    `export const PRODUCT = Object.freeze(${JSON.stringify(normalizedProduct, null, 2)}${suffix});`,
    `export const PAINTS = Object.freeze(${JSON.stringify(paints, null, 2)}${suffix});`,
    `export const VALUES_HASH = ${JSON.stringify(hash)};`,
    generatedRuntime(options.language).trimStart(),
  ].join("\n");
}
