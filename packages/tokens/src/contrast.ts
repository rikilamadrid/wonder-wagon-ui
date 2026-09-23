/**
 * WCAG 2.x contrast, computed from token values. Pathfinder's contrast.mjs and
 * Lorekeeper's build.mjs made ecosystem-wide: the pairings are declared beside the
 * tokens, the gate reads them, and a value change fails a test rather than leaving a
 * stale number in a comment.
 */
import { BAR, type Env, type Pair, type PairKind } from "./tokens.js";

const HEX = /^#([0-9a-f]{6})$/i;

export function isHex(value: string): boolean {
  return HEX.test(value.trim());
}

function channel(component: number): number {
  const c = component / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const m = HEX.exec(hex.trim());
  if (!m) throw new Error(`not a 6-digit hex colour: ${hex}`);
  const n = Number.parseInt(m[1] as string, 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

/** Contrast ratio between two opaque 6-digit hex colours. */
export function ratio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface Measurement {
  readonly env: Env;
  readonly fg: string;
  readonly on: string;
  readonly fgHex: string;
  readonly onHex: string;
  readonly kind: PairKind;
  readonly ratio: number | null;
  readonly bar: number;
  readonly passes: boolean;
  readonly note?: string;
}

/**
 * Measure every declared pairing in one environment.
 * `resolve(name, env)` returns the hex for a semantic name. Translucent or
 * `transparent` values cannot be measured and are reported with `ratio: null` and
 * `passes: true` only when their kind is exempt.
 */
export function measure(
  pairs: ReadonlyArray<{ fg: string; pair: Pair }>,
  env: Env,
  resolve: (name: string, env: Env) => string,
): Measurement[] {
  return pairs.map(({ fg, pair }) => {
    const fgHex = resolve(fg, env);
    const onHex = resolve(pair.on, env);
    const bar = BAR[pair.kind];
    const measurable = isHex(fgHex) && isHex(onHex);
    const r = measurable ? Math.round(ratio(fgHex, onHex) * 100) / 100 : null;
    const passes = r === null ? bar === 0 : r >= bar;
    const row: Measurement = {
      env,
      fg,
      on: pair.on,
      fgHex,
      onHex,
      kind: pair.kind,
      ratio: r,
      bar,
      passes,
    };
    return pair.note === undefined ? row : { ...row, note: pair.note };
  });
}

export function formatRatio(r: number | null): string {
  return r === null ? "—" : r.toFixed(2);
}
