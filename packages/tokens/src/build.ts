/**
 * Generate every output from the token source, or check that the committed outputs
 * are current and every declared pairing clears its bar.
 *
 *   node dist/build.js          write dist/tokens.css, tokens.unlayered.css, tokens.dtcg.json, CONTRAST.md
 *   node dist/build.js --check  exit 1 if any output is stale or any pair fails
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatRatio, type Measurement, measure } from "./contrast.js";
import { renderTokensCss, semanticValues } from "./render.js";
import {
  breakpoints,
  type ColorToken,
  code,
  depth,
  type Env,
  material,
  motion,
  type Pair,
  radius,
  semanticColor,
  size,
  space,
  themeSlotPairs,
  themeSlots,
  type,
} from "./tokens.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = HERE; // build.js runs from dist/

/**
 * Every pairing to measure in one environment. The bare `signal` on the page is
 * exempt where the theme supplies a `signal-edge` for that environment; the edge is
 * then held to the non-text bar instead — the rule blaze established on paper.
 */
export function allPairs(
  env: Env,
  values: Record<string, string> = semanticValues(env),
): Array<{ fg: string; pair: Pair }> {
  const out: Array<{ fg: string; pair: Pair }> = [];
  for (const [name, token] of Object.entries(semanticColor as Record<string, ColorToken>))
    for (const pair of token.pairs ?? []) out.push({ fg: name, pair });
  const edged = values["signal-edge"] !== undefined && values["signal-edge"] !== "transparent";
  for (const slot of themeSlots) {
    for (const pair of themeSlotPairs[slot]) {
      if (slot === "signal" && pair.on === "ground" && edged) {
        out.push({
          fg: "signal-edge",
          pair: { on: "ground", kind: "non-text", note: "the outline the signal carries on paper" },
        });
        continue;
      }
      out.push({ fg: slot, pair });
    }
  }
  return out;
}

export function measureAll(): Measurement[] {
  const rows: Measurement[] = [];
  for (const env of ["day", "night"] as Env[]) {
    const values = semanticValues(env);
    rows.push(
      ...measure(allPairs(env, values), env, (name, e) => {
        const v = (e === env ? values : semanticValues(e))[name];
        if (v === undefined) throw new Error(`unknown semantic name in a pair: ${name}`);
        return v;
      }),
    );
  }
  return rows;
}

function dtcg(): string {
  const color: Record<string, unknown> = { material: {}, semantic: {} };
  for (const [name, value] of Object.entries(material))
    (color.material as Record<string, unknown>)[name] = { $type: "color", $value: value };
  for (const [name, token] of Object.entries(semanticColor as Record<string, ColorToken>)) {
    (color.semantic as Record<string, unknown>)[name] = {
      $type: "color",
      $value: token.value.day,
      $description: token.about,
      $extensions: { "wonder-wagon": { night: token.value.night, pairs: token.pairs ?? [] } },
    };
  }
  const out = {
    $schema: "https://tr.designtokens.org/format/",
    $description:
      "Wonder Wagon tokens. Day values are $value; night values and contrast pairings live under $extensions['wonder-wagon']. Generated; do not edit.",
    color,
    depth: Object.fromEntries(
      Object.entries(depth).map(([n, t]) => [
        n,
        {
          $type: "shadow",
          $value: typeof t.value === "string" ? t.value : t.value.day,
          $description: t.about,
          ...(typeof t.value === "string"
            ? {}
            : { $extensions: { "wonder-wagon": { night: t.value.night } } }),
        },
      ]),
    ),
    type: Object.fromEntries(
      Object.entries(type).map(([n, t]) => [
        n,
        {
          $type: n.startsWith("font-") ? "fontFamily" : "dimension",
          $value: t.value,
          $description: t.about,
        },
      ]),
    ),
    space: Object.fromEntries(
      Object.entries(space).map(([n, v]) => [n, { $type: "dimension", $value: v }]),
    ),
    size: Object.fromEntries(
      Object.entries(size).map(([n, v]) => [n, { $type: "dimension", $value: v }]),
    ),
    radius: Object.fromEntries(
      Object.entries(radius).map(([n, v]) => [n, { $type: "dimension", $value: v }]),
    ),
    motion: Object.fromEntries(
      Object.entries(motion).map(([n, v]) => [
        n,
        { $type: n.startsWith("ease") ? "cubicBezier" : "duration", $value: v },
      ]),
    ),
    breakpoints: Object.fromEntries(
      Object.entries(breakpoints).map(([n, v]) => [n, { $type: "dimension", $value: v }]),
    ),
    code: Object.fromEntries(
      Object.entries(code).map(([n, v]) => [
        n,
        { $type: "color", $value: v.day, $extensions: { "wonder-wagon": { night: v.night } } },
      ]),
    ),
  };
  return `${JSON.stringify(out, null, 2)}\n`;
}

function contrastMarkdown(rows: Measurement[]): string {
  const lines = [
    "# Contrast record",
    "",
    "Generated by `packages/tokens/src/build.ts` from the pairings declared in `tokens.ts`.",
    "Bars: text 4.5 · non-text 3.0 · decorative measured only · seam exempt by the",
    "material-adjacency rule. A failing row fails `bun run check`.",
    "",
    "| Env | Colour | On | Kind | Ratio | Bar | Result |",
    "|---|---|---|---|---:|---:|---|",
  ];
  for (const r of rows) {
    lines.push(
      `| ${r.env} | \`${r.fg}\` ${r.fgHex} | \`${r.on}\` ${r.onHex} | ${r.kind} | ${formatRatio(r.ratio)} | ${r.bar || "—"} | ${r.passes ? "pass" : "**FAIL**"}${r.note ? ` — ${r.note}` : ""} |`,
    );
  }
  const failures = rows.filter((r) => !r.passes).length;
  lines.push("", `${rows.length} pairings measured, ${failures} failing.`, "");
  return lines.join("\n");
}

export function outputs(): Record<string, string> {
  const rows = measureAll();
  return {
    "tokens.css": renderTokensCss({ layer: true }),
    "tokens.unlayered.css": renderTokensCss({ layer: false }),
    "tokens.dtcg.json": dtcg(),
    "CONTRAST.md": contrastMarkdown(rows),
  };
}

function main(): void {
  const check = process.argv.includes("--check");
  const rows = measureAll();
  const failures = rows.filter((r) => !r.passes);
  const files = outputs();
  let stale = 0;
  mkdirSync(DIST, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const path = join(DIST, name);
    if (check) {
      let current = "";
      try {
        current = readFileSync(path, "utf8");
      } catch {
        current = "";
      }
      if (current !== content) {
        stale += 1;
        console.error(`stale: ${name}`);
      }
    } else {
      writeFileSync(path, content);
    }
  }
  for (const f of failures)
    console.error(
      `contrast FAIL (${f.env}) ${f.fg} ${f.fgHex} on ${f.on} ${f.onHex}: ${formatRatio(f.ratio)} < ${f.bar}`,
    );
  console.log(
    `${rows.length} pairings measured, ${failures.length} failing${check ? `, ${stale} stale outputs` : ""}.`,
  );
  if (failures.length > 0 || stale > 0) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
