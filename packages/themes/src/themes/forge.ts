import type { ProductTheme } from "../contract.js";

/**
 * Forge — the pocket fabricator. Absorbs the identity Forge shipped on 2026-09-18
 * (The Village Smithy: iron grounds, one bronze accent, steel structure) the way
 * Lorekeeper's shipped identity was absorbed: equity kept, only conflicting rules retired.
 *
 * Ember is the ecosystem's enamel assignment (Atelier Feature 02). Bronze is Forge's
 * shipped hallmark and stays the signal — the mark's colour, exactly as blaze is
 * Pathfinder's. Brass #E0B166 is Forge's shipped link colour and stays the night link.
 * Two questions are open for the human and recorded in Feature 05's report:
 * Forge's Iron ground #17130D versus Workshop Night #17191C, and Ember as a second
 * hue beside the shipped single-accent budget.
 */
export const forge: ProductTheme = {
  id: "forge",
  name: "Forge",
  product: "Local AI kit — the smithy",
  serial: "FG",
  status: "pilot",
  enamel: { day: "#B03A26", night: "#C2402A" },
  accent: { day: "#B03A26", night: "#C2402A" },
  accentLow: { day: "#F6D9D3", night: "#3A1410" },
  accentInk: { day: "#F7F0DF", night: "#F7F0DF" },
  link: { day: "#B03A26", night: "#E0B166" },
  signal: { day: "#85601A", night: "#C8973F" },
  signalEdge: { day: "transparent", night: "transparent" },
  radiusObject: "6px 6px 14px 14px",
  source:
    "rikilamadrid/forge context/brand-identity.md (approved 2026-09-18) + Atelier Feature 02 product identity sheet. Object radius is a placeholder until Forge's object pilot.",
  notes: [
    "Ember #B03A26 / #C2402A: 5.45 on Quiet Paper, 3.41 against Workshop Night, Lamplight 5.31 / 4.55 on it.",
    "Bronze #C8973F on night 6.67; Dark bronze #85601A on Quiet Paper 5.15 — the shipped light-ground substitution, kept.",
    "Whiteheat #FFD96B is Forge's core glow, dark-only, emissive; it is an object colour and is not a theme slot.",
  ],
};
export default forge;
