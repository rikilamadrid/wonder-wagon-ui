import type { ProductTheme } from "../contract.js";

/** Lorekeeper — the index reliquary. DRAFT: enamel and signal from Feature 02 and the shipped identity; nothing else decided. */
export const lorekeeper: ProductTheme = {
  id: "lorekeeper",
  name: "Lorekeeper",
  product: "AI second-brain kit — the reading room",
  serial: "LK",
  status: "draft",
  enamel: { day: "#343A8C", night: "#5D64C3" },
  accent: { day: "#343A8C", night: "#5D64C3" },
  accentLow: { day: "#E1E3F5", night: "#1E2140" },
  accentInk: { day: "#FAF7F1", night: "#FAF7F1" },
  link: { day: "#343A8C", night: "#99A2F0" },
  signal: { day: "#8A6212", night: "#E2B45C" },
  signalEdge: { day: "transparent", night: "transparent" },
  radiusObject: "4px 4px 10px 10px",
  source:
    "Atelier Feature 02 (absorb the shipped identity, ruled 2026-09-22); rikilamadrid/lorekeeper brand/tokens/tokens.json. Draft — not yet piloted.",
  notes: [
    "Gilt is never text on Field Paper (4.08); the four-point star is parchment on indigo, never gilt on indigo (1.80).",
  ],
};
export default lorekeeper;
