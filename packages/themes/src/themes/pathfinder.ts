import type { ProductTheme } from "../contract.js";

/**
 * Pathfinder — the unfolding atlascope. Values are exactly what site/src/styles/brand.css
 * ships at rikilamadrid/pathfinder@163e589; the proof in ../proof/pathfinder.ts holds them to it.
 */
export const pathfinder: ProductTheme = {
  id: "pathfinder",
  name: "Pathfinder",
  product: "AI workflow kit — the field manual",
  serial: "PF",
  status: "approved",
  enamel: { day: "#12496B", night: "#1C73A8" },
  accent: { day: "#B34A13", night: "#B34A13" },
  accentLow: { day: "#FBDCC9", night: "#3A1607" },
  // brand.css uses white on the accent button (5.38); Lamplight measures 4.73 and is the family's light ink.
  accentInk: { day: "#F7F0DF", night: "#F7F0DF" },
  link: { day: "#9E3F0F", night: "#F0A97E" },
  signal: { day: "#E0611F", night: "#E0611F" },
  signalEdge: { day: "#553316", night: "transparent" },
  radiusObject: "18px 26px 15px 23px",
  source:
    "rikilamadrid/pathfinder site/src/styles/brand.css @163e589 (PR #136, 2026-09-23); Atelier Feature 02 product identity sheet.",
  notes: [
    "Blaze #E0611F is the signal — needle, trail, active item — never a ground and never a word. On paper it carries an Edge outline (2.66 bare on Field Paper, 3.22 on Quiet Paper).",
    "The four-bar mark, favicon and wordmark are Pathfinder's and are not represented here.",
  ],
};
export default pathfinder;
