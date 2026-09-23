import type { ProductTheme } from "../contract.js";

/** Lama — the satchel familiar. DRAFT: enamel and signal from Feature 02; Lama integration is a later feature. */
export const lama: ProductTheme = {
  id: "lama",
  name: "Lama",
  product: "Local AI machine assistant — the companion",
  serial: "LM",
  status: "draft",
  enamel: { day: "#0F6F76", night: "#107981" },
  accent: { day: "#0F6F76", night: "#107981" },
  accentLow: { day: "#D6EAEA", night: "#0F2A2C" },
  accentInk: { day: "#F7F0DF", night: "#F7F0DF" },
  link: { day: "#0F6F76", night: "#5CCBBB" },
  signal: { day: "#A66C39", night: "#A66C39" },
  signalEdge: { day: "transparent", night: "transparent" },
  radiusObject: "22px 14px 26px 12px",
  source:
    "Atelier Feature 02 product identity sheet. Draft — Lama is the later first production consumer of @wonder-wagon/ui.",
  notes: [
    "Lama is the only product allowed soft goods, a face or a voice; none of that is a theme slot.",
  ],
};
export default lama;
