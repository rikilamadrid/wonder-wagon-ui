/**
 * The contrast gate's own results, recomputed at build time from the same sources the gate
 * runs on: every declared token pairing, and every product theme's slot pairings.
 */
import { themes, validateTheme } from "@wonder-wagon/themes";
// measureAll is the gate's function; it is not part of the tokens package's public exports,
// so the catalog reads it from the workspace build like the gate itself does.
import { measureAll } from "../../../../packages/tokens/dist/build.js";

export const tokenPairs = measureAll();
export const themePairs = Object.entries(themes).flatMap(([id, theme]) =>
  validateTheme(theme).map((finding) => ({ theme: id, status: theme.status, ...finding })),
);
export const total = tokenPairs.length + themePairs.length;
export const failing =
  tokenPairs.filter((p) => !p.passes).length + themePairs.filter((p) => !p.passes).length;
