export * from "./contract.js";
export { renderThemeCss, renderThemeJson } from "./render.js";
export { forge } from "./themes/forge.js";
export { lama } from "./themes/lama.js";
export { lorekeeper } from "./themes/lorekeeper.js";
export { pathfinder } from "./themes/pathfinder.js";
export { wonderWagon } from "./themes/wonder-wagon.js";

import { forge } from "./themes/forge.js";
import { lama } from "./themes/lama.js";
import { lorekeeper } from "./themes/lorekeeper.js";
import { pathfinder } from "./themes/pathfinder.js";
import { wonderWagon } from "./themes/wonder-wagon.js";
export const themes = { "wonder-wagon": wonderWagon, pathfinder, forge, lorekeeper, lama } as const;
