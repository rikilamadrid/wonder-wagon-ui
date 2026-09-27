/**
 * A build-time reader for captured terminal bytes. It understands exactly what the family's
 * CLIs emit — SGR colour and weight, nothing else — and turns each line into styled runs.
 * Any other escape sequence is dropped rather than guessed at.
 */

export interface Run {
  readonly text: string;
  readonly fg?: string;
  readonly bold?: boolean;
  readonly dim?: boolean;
}
export type Line = readonly Run[];

/**
 * The ANSI-16 colours as xterm draws them by default. A real terminal substitutes its own
 * theme here, which is why the family treats 16-colour output as a fallback.
 */
const ANSI16 = [
  "#000000",
  "#CD0000",
  "#00CD00",
  "#CDCD00",
  "#0000EE",
  "#CD00CD",
  "#00CDCD",
  "#E5E5E5",
  "#7F7F7F",
  "#FF0000",
  "#00FF00",
  "#FFFF00",
  "#5C5CFF",
  "#FF00FF",
  "#00FFFF",
  "#FFFFFF",
];

const hex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();

function ansi256(n: number): string {
  if (n < 16) return ANSI16[n] ?? "#FFFFFF";
  if (n >= 232) {
    const v = 8 + (n - 232) * 10;
    return `#${hex(v)}${hex(v)}${hex(v)}`;
  }
  const i = n - 16;
  const steps = [0, 95, 135, 175, 215, 255];
  return `#${hex(steps[Math.floor(i / 36)] ?? 0)}${hex(steps[Math.floor(i / 6) % 6] ?? 0)}${hex(steps[i % 6] ?? 0)}`;
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: the escape byte is the subject
const SEQUENCE = /\u001B\[([0-9;]*)([A-Za-z])|\u001B[()][0-9A-Za-z]|\u001B[=>]/g;

export function parseAnsi(input: string): Line[] {
  const lines: Run[][] = [[]];
  let fg: string | undefined;
  let bold = false;
  let dim = false;
  const push = (text: string) => {
    const parts = text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1]?.push({ text: part, fg, bold, dim });
    });
  };
  let last = 0;
  for (const match of input.matchAll(SEQUENCE)) {
    push(input.slice(last, match.index));
    last = (match.index ?? 0) + match[0].length;
    if (match[2] !== "m") continue;
    const codes = (match[1] || "0").split(";").map(Number);
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i] ?? 0;
      if (code === 0) {
        fg = undefined;
        bold = false;
        dim = false;
      } else if (code === 1) bold = true;
      else if (code === 2) dim = true;
      else if (code === 22) {
        bold = false;
        dim = false;
      } else if (code === 39) fg = undefined;
      else if (code >= 30 && code <= 37) fg = ANSI16[code - 30];
      else if (code >= 90 && code <= 97) fg = ANSI16[code - 90 + 8];
      else if (code === 38 && codes[i + 1] === 5) {
        fg = ansi256(codes[i + 2] ?? 7);
        i += 2;
      } else if (code === 38 && codes[i + 1] === 2) {
        fg = `#${hex(codes[i + 2] ?? 0)}${hex(codes[i + 3] ?? 0)}${hex(codes[i + 4] ?? 0)}`;
        i += 4;
      }
    }
  }
  push(input.slice(last));
  while (lines.length > 1 && lines[lines.length - 1]?.length === 0) lines.pop();
  return lines;
}
