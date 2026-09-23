import { wonderWagonDefaults } from "@wonder-wagon/tokens";
import type { ProductTheme } from "../contract.js";

/** Maker 047's bench: the design system's own identity. Bench Green over blackened iron, worn brass as the signal. */
export const wonderWagon: ProductTheme = {
  id: "wonder-wagon",
  name: "Wonder Wagon UI",
  product: "The design system — Maker 047's bench",
  serial: wonderWagonDefaults.serial,
  status: "pilot",
  enamel: wonderWagonDefaults.enamel,
  accent: wonderWagonDefaults.accent,
  accentLow: wonderWagonDefaults["accent-low"],
  accentInk: wonderWagonDefaults["accent-ink"],
  link: wonderWagonDefaults.link,
  signal: wonderWagonDefaults.signal,
  signalEdge: wonderWagonDefaults["signal-edge"],
  radiusObject: wonderWagonDefaults.radiusObject,
  source:
    "Atelier Feature 04 decision D11, approved as art direction 2026-09-23; one refinement pass before stable.",
  notes: [
    "Bench Green #285A1C / #347A32: 6.10 on Field Paper, 7.39 on Quiet Paper, 3.33 against Workshop Night, Lamplight 4.65 on the night value.",
    "Worn brass #E2B26A is emissive at night and carries an Edge outline on paper (1.45 bare).",
  ],
};
export default wonderWagon;
