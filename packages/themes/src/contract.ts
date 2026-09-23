/**
 * The product-theme contract. A theme fills exactly these slots and nothing else;
 * grounds, ink, hairlines, focus, depth and space are the family and stay in tokens.
 */
import { type Env, type EnvValue, isHex, ratio, semanticValues } from "@wonder-wagon/tokens";

export type ThemeId = "wonder-wagon" | "pathfinder" | "forge" | "lorekeeper" | "lama";
export type ThemeStatus = "approved" | "pilot" | "draft";

export interface ProductTheme {
  readonly id: ThemeId;
  readonly name: string;
  readonly product: string;
  /** Serial prefix stamped on every surface: PF, FG, LK, LM, WW. Maker 047 is the family thread. */
  readonly serial: string;
  readonly status: ThemeStatus;
  /** The product colour, fired onto the shared metal. Day and night values, both measured. */
  readonly enamel: EnvValue;
  readonly accent: EnvValue;
  readonly accentLow: EnvValue;
  readonly accentInk: EnvValue;
  readonly link: EnvValue;
  readonly signal: EnvValue;
  /** `transparent` where the signal needs no outline against that environment's ground. */
  readonly signalEdge: EnvValue;
  /** Four values, asymmetric. The irregularity is load-bearing. */
  readonly radiusObject: string;
  readonly source: string;
  readonly notes: readonly string[];
}

export const SLOT_KEYS = {
  accent: "accent",
  accentLow: "accent-low",
  accentInk: "accent-ink",
  link: "link",
  signal: "signal",
  signalEdge: "signal-edge",
} as const;

/** The complete semantic map for one environment with this theme applied. */
export function resolveSemantic(theme: ProductTheme, env: Env): Record<string, string> {
  const map = semanticValues(env);
  for (const [key, name] of Object.entries(SLOT_KEYS) as Array<[keyof typeof SLOT_KEYS, string]>) {
    map[name] = theme[key][env];
  }
  return map;
}

export interface Finding {
  readonly env: Env;
  readonly rule: string;
  readonly fg: string;
  readonly on: string;
  readonly ratio: number | null;
  readonly bar: number;
  readonly passes: boolean;
}

function measurePair(
  env: Env,
  rule: string,
  fg: string,
  fgHex: string,
  on: string,
  onHex: string,
  bar: number,
): Finding {
  const measurable = isHex(fgHex) && isHex(onHex);
  const r = measurable ? Math.round(ratio(fgHex, onHex) * 100) / 100 : null;
  return {
    env,
    rule,
    fg: `${fg} ${fgHex}`,
    on: `${on} ${onHex}`,
    ratio: r,
    bar,
    passes: r === null ? bar === 0 : r >= bar,
  };
}

/**
 * Validate a theme against the contract. Shape errors throw; contrast findings are
 * returned so the build can print them all before failing.
 */
export function validateTheme(theme: ProductTheme): Finding[] {
  const envValues: Array<[string, EnvValue, boolean]> = [
    ["enamel", theme.enamel, false],
    ["accent", theme.accent, false],
    ["accentLow", theme.accentLow, false],
    ["accentInk", theme.accentInk, false],
    ["link", theme.link, false],
    ["signal", theme.signal, false],
    ["signalEdge", theme.signalEdge, true],
  ];
  for (const [name, value, allowTransparent] of envValues) {
    for (const env of ["day", "night"] as const) {
      const v = value[env];
      if (!(isHex(v) || (allowTransparent && v === "transparent"))) {
        throw new Error(
          `${theme.id}.${name}.${env} must be a 6-digit hex${allowTransparent ? " or transparent" : ""}, got ${JSON.stringify(v)}`,
        );
      }
    }
  }
  if (!/^[A-Z]{2}$/.test(theme.serial))
    throw new Error(`${theme.id}.serial must be two capitals, got ${theme.serial}`);
  if (theme.radiusObject.trim().split(/\s+/).length !== 4)
    throw new Error(`${theme.id}.radiusObject must be a four-value set`);

  const findings: Finding[] = [];
  for (const env of ["day", "night"] as const) {
    const s = resolveSemantic(theme, env);
    const ink = s.ink as string;
    findings.push(
      measurePair(
        env,
        "accent-ink is legible on a filled accent",
        "accent-ink",
        theme.accentInk[env],
        "accent",
        theme.accent[env],
        4.5,
      ),
      measurePair(
        env,
        "link is body-legal on the page",
        "link",
        theme.link[env],
        "ground",
        s.ground as string,
        4.5,
      ),
      measurePair(
        env,
        "link is body-legal on a side panel",
        "link",
        theme.link[env],
        "ground-side",
        s["ground-side"] as string,
        4.5,
      ),
      measurePair(
        env,
        "link is body-legal on a card",
        "link",
        theme.link[env],
        "surface",
        s.surface as string,
        4.5,
      ),
      measurePair(
        env,
        "enamel reads as an object boundary against the page",
        "enamel",
        theme.enamel[env],
        "ground",
        s.ground as string,
        3,
      ),
      measurePair(
        env,
        "enamel reads as an object boundary against the stage",
        "enamel",
        theme.enamel[env],
        "ground-stage",
        s["ground-stage"] as string,
        3,
      ),
      measurePair(
        env,
        "ink is legible on the low accent tint",
        "ink",
        ink,
        "accent-low",
        theme.accentLow[env],
        4.5,
      ),
    );
    if (theme.signalEdge[env] === "transparent") {
      findings.push(
        measurePair(
          env,
          "a bare signal clears the non-text bar against the page",
          "signal",
          theme.signal[env],
          "ground",
          s.ground as string,
          3,
        ),
      );
    } else {
      findings.push(
        measurePair(
          env,
          "the signal's edge clears the non-text bar against the page",
          "signal-edge",
          theme.signalEdge[env],
          "ground",
          s.ground as string,
          3,
        ),
      );
    }
  }
  return findings;
}
