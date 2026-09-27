#!/usr/bin/env node
/**
 * Draw a recorded terminal capture as a self-grounded SVG for a README.
 *
 *   node ansi2svg.mjs <in.ansi> <out.svg> --ground <hex> --fg <hex> [--lines N]
 *        [--title "<caption in the title bar>"] [--label "<aria label>"]
 *        [--source "<one line recorded in a comment>"]
 *
 * The bytes are the capture's own: SGR colour, bold and dim are honoured, and
 * nothing is retyped. Block elements (U+2580–U+259F) are drawn as rectangles
 * on the cell grid so a mark keeps its geometry whatever monospace font the
 * reader has. Other text is live <text>, each run pinned to its column.
 */
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const [inp, out] = args;
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const GROUND = opt("ground", "#17191C");
const FG = opt("fg", "#F7F0DF");
const LINES = opt("lines") ? Number(opt("lines")) : Infinity;
const TITLE = opt("title", "");
const LABEL = opt("label", "Terminal output");
const SOURCE = opt("source", "");

const FONT = 14;
const CW = 8.4; // cell width at 14px for common monospace faces
const LH = 20; // cell height; blocks fill it exactly so rows join
const PADX = 28;
const PADTOP = 52;
const PADBOTTOM = 26;

// Dim is drawn as the colour mixed toward the ground, not as opacity, so
// adjacent block rectangles never double up into visible seams.
const mix = (hex, amount = 0.62) => {
  const a = hex.match(/[0-9a-f]{2}/gi).map((h) => parseInt(h, 16));
  const b = GROUND.match(/[0-9a-f]{2}/gi).map((h) => parseInt(h, 16));
  return `#${a
    .map((v, k) =>
      Math.round(v * amount + b[k] * (1 - amount))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
};
const paint = (cell) => (cell.dim ? mix(cell.fg ?? FG) : cell.fg);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Parse into rows of cells: { ch, fg, bold, dim }.
const raw = readFileSync(inp, "utf8").replace(/\r\n/g, "\n");
// The escape byte is built, not written literally, to keep the regex free of control characters.
const CSI = new RegExp(`^${String.fromCharCode(27)}\\[([0-9;?]*)([A-Za-z])`);
const rows = [[]];
let st = { fg: null, bold: false, dim: false };
for (let i = 0; i < raw.length; ) {
  if (raw[i] === "\x1b") {
    const m = CSI.exec(raw.slice(i));
    if (m) {
      if (m[2] === "m") {
        const p = m[1] === "" ? [0] : m[1].split(";").map(Number);
        for (let k = 0; k < p.length; k++) {
          const c = p[k];
          if (c === 0) st = { fg: null, bold: false, dim: false };
          else if (c === 1) st = { ...st, bold: true };
          else if (c === 2) st = { ...st, dim: true };
          else if (c === 22) st = { ...st, bold: false, dim: false };
          else if (c === 39) st = { ...st, fg: null };
          else if (c === 38 && p[k + 1] === 2) {
            const hex = p
              .slice(k + 2, k + 5)
              .map((n) => n.toString(16).padStart(2, "0"))
              .join("");
            st = { ...st, fg: `#${hex.toUpperCase()}` };
            k += 4;
          }
        }
      }
      i += m[0].length;
      continue;
    }
  }
  const cp = raw.codePointAt(i);
  const ch = String.fromCodePoint(cp);
  i += ch.length;
  if (ch === "\n") rows.push([]);
  else rows[rows.length - 1].push({ ch, ...st });
}
while (rows.length && rows[rows.length - 1].length === 0) rows.pop();
while (rows.length && rows[0].every((c) => c.ch === " ")) rows.shift();
const shown = rows.slice(0, LINES);
while (shown.length && shown[shown.length - 1].every((c) => c.ch === " ")) shown.pop();

// Wide glyphs (emoji) take two cells.
const width = (ch) => (/\p{Extended_Pictographic}/u.test(ch) ? 2 : 1);
const cols = Math.max(...shown.map((r) => r.reduce((n, c) => n + width(c.ch), 0)));

// Quadrants: TL, TR, BL, BR.
const Q = {
  "▘": [1, 0, 0, 0],
  "▝": [0, 1, 0, 0],
  "▖": [0, 0, 1, 0],
  "▗": [0, 0, 0, 1],
  "▀": [1, 1, 0, 0],
  "▄": [0, 0, 1, 1],
  "▌": [1, 0, 1, 0],
  "▐": [0, 1, 0, 1],
  "▚": [1, 0, 0, 1],
  "▞": [0, 1, 1, 0],
  "▛": [1, 1, 1, 0],
  "▜": [1, 1, 0, 1],
  "▙": [1, 0, 1, 1],
  "▟": [0, 1, 1, 1],
  "█": [1, 1, 1, 1],
};

const W = Math.ceil(PADX * 2 + cols * CW);
const H = Math.ceil(PADTOP + shown.length * LH + PADBOTTOM);
const body = [];
shown.forEach((row, r) => {
  const top = PADTOP + r * LH;
  const base = top + LH * 0.72;
  let col = 0;
  let run = null;
  // Each space-separated segment is pinned to its own column, so spacing never
  // depends on how a renderer treats runs of whitespace.
  const flush = () => {
    if (!run) return;
    for (const m of run.text.matchAll(/\S+/g)) {
      const attrs = [
        `x="${(PADX + (run.col + m.index) * CW).toFixed(1)}"`,
        `y="${base.toFixed(1)}"`,
        run.paint ? `fill="${run.paint}"` : "",
        run.bold ? `font-weight="700"` : "",
        `textLength="${(m[0].length * CW).toFixed(1)}"`,
        `lengthAdjust="spacingAndGlyphs"`,
      ].filter(Boolean);
      body.push(`<text ${attrs.join(" ")}>${esc(m[0])}</text>`);
    }
    run = null;
  };
  for (const cell of row) {
    const q = Q[cell.ch];
    const wide = width(cell.ch) === 2;
    if (q || wide) {
      flush();
      if (q) {
        const fill = paint(cell) ?? FG;
        const x0 = PADX + col * CW;
        const hw = CW / 2;
        const hh = LH / 2;
        q.forEach((on, k) => {
          if (!on) return;
          const x = x0 + (k % 2) * hw;
          const y = top + Math.floor(k / 2) * hh;
          body.push(
            `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(hw + 0.6).toFixed(2)}" height="${(hh + 0.6).toFixed(2)}" fill="${fill}"/>`,
          );
        });
      } else {
        body.push(
          `<text x="${(PADX + col * CW).toFixed(1)}" y="${base.toFixed(1)}" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${esc(cell.ch)}</text>`,
        );
      }
      col += width(cell.ch);
      continue;
    }
    const same = run && run.paint === paint(cell) && run.bold === cell.bold;
    if (!same) {
      flush();
      run = { col, text: "", paint: paint(cell), bold: cell.bold };
    }
    run.text += cell.ch;
    col += 1;
  }
  flush();
});

const dots = [0, 1, 2]
  .map((k) => `<circle cx="${22 + k * 16}" cy="20" r="5" fill="${FG}" opacity=".18"/>`)
  .join("");
const title = TITLE
  ? `<text x="${W - 20}" y="24.5" text-anchor="end" font-family="ui-monospace,'SFMono-Regular',Menlo,Consolas,monospace" font-size="11" letter-spacing=".5" fill="${mix(FG, 0.55)}">${esc(TITLE)}</text>`
  : "";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(LABEL)}">
<!-- Generated from a recorded terminal capture; the bytes are the capture's own.${SOURCE ? `\n     Source: ${esc(SOURCE)}` : ""} -->
<title>${esc(LABEL)}</title>
<rect width="${W}" height="${H}" rx="12" fill="${GROUND}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="11.5" fill="none" stroke="${FG}" stroke-opacity=".14"/>
<rect x="1" y="39" width="${W - 2}" height="1" fill="${FG}" opacity=".1"/>
${dots}${title}
<g font-family="ui-monospace,'SFMono-Regular','SF Mono',Menlo,Consolas,'Liberation Mono',monospace" font-size="${FONT}" fill="${FG}">
${body.join("\n")}
</g>
</svg>
`;
writeFileSync(out, svg);
console.log(`${out}: ${W}x${H}, ${shown.length} rows, ${cols} cols`);
