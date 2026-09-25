import type { ProductTheme } from "../contract.js";

/**
 * Lorekeeper — the reading room. Absorbs the identity Lorekeeper shipped on 2026-09-18;
 * its brand/tokens/tokens.json stays the product source, and every value here that restates
 * it is held to it by proof/lorekeeper.ts against a pinned fixture.
 *
 * Enamel and accent are two roles, not one colour. Enamel is the object colour Atelier
 * Feature 02 assigned (Reliquary Indigo, night #5D64C3). The accent is the signature fill,
 * and at night Lorekeeper fills with its own periwinkle #99A2F0 under dark ink #141521, as
 * its shipped night button does, so the family's light-ink night convention does not hold
 * for this theme (Atelier Feature 08, decision T, 2026-09-25). Pilot: the CLI build consumes
 * it; approved once the Lorekeeper site does.
 */
export const lorekeeper: ProductTheme = {
  id: "lorekeeper",
  name: "Lorekeeper",
  product: "AI second-brain kit — the reading room",
  serial: "LK",
  status: "pilot",
  enamel: { day: "#343A8C", night: "#5D64C3" },
  accent: { day: "#343A8C", night: "#99A2F0" },
  accentLow: { day: "#E1E3F5", night: "#1E2140" },
  accentInk: { day: "#FAF7F1", night: "#141521" },
  link: { day: "#343A8C", night: "#99A2F0" },
  signal: { day: "#8A6212", night: "#E2B45C" },
  signalEdge: { day: "transparent", night: "transparent" },
  radiusObject: "4px 4px 10px 10px",
  source:
    "rikilamadrid/lorekeeper brand/tokens/tokens.json (approved 2026-09-18), proven against the fixture at lorekeeper@6ea0c28; night enamel from Atelier Feature 02; night accent ruled in Atelier Feature 08 (decision T, 2026-09-25). Pilot — consumed by the Lorekeeper CLI build since lorekeeper@6ea0c28.",
  notes: [
    "Gilt is never text on Field Paper (4.08); the four-point star is parchment on indigo, never gilt on indigo (1.80 day, 2.68 night).",
    "Night accent #99A2F0 is a fill under dark ink #141521 (7.58), not under parchment (2.24). The object colour stays enamel #5D64C3; do not collapse the two.",
    "accentLow and radiusObject are Wonder Wagon-derived placeholders with no Lorekeeper source; Lorekeeper's own radii are symmetric (6 / 10).",
  ],
};
export default lorekeeper;
