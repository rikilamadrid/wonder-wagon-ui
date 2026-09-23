// Generate the package exports map from the component directories, so a new component
// cannot be forgotten and a removed one cannot linger. `--check` fails when stale.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const components = readdirSync(join(root, "src", "components"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const exportsMap = { ".": { types: "./dist/index.d.ts", default: "./dist/index.js" } };
for (const name of components) {
  const k = kebab(name);
  exportsMap[`./${k}`] = {
    types: `./dist/components/${name}/index.d.ts`,
    default: `./dist/${k}.js`,
  };
}
exportsMap["./styles.css"] = "./dist/styles.css";
exportsMap["./styles.unlayered.css"] = "./dist/styles.unlayered.css";
for (const name of components) exportsMap[`./${kebab(name)}.css`] = `./dist/${kebab(name)}.css`;
exportsMap["./package.json"] = "./package.json";

const next = { ...pkg, exports: exportsMap };
const text = `${JSON.stringify(next, null, 2)}\n`;
// are-the-types-wrong checks every entry point; stylesheets and package.json have no types by
// design, so they are excluded through a config generated beside the exports map.
const attwPath = join(root, ".attw.json");
const attw = `${JSON.stringify({ excludeEntrypoints: Object.keys(exportsMap).filter((k) => k.endsWith(".css") || k === "./package.json") }, null, 2)}\n`;
if (process.argv.includes("--check")) {
  let currentAttw = "";
  try {
    currentAttw = readFileSync(attwPath, "utf8");
  } catch {
    currentAttw = "";
  }
  if (readFileSync(pkgPath, "utf8") !== text || currentAttw !== attw) {
    console.error("package.json exports are stale; run `bun run build`");
    process.exit(1);
  }
  console.log("exports: current");
} else {
  writeFileSync(pkgPath, text);
  writeFileSync(attwPath, attw);
  console.log(`exports: ${Object.keys(exportsMap).length} entries written`);
}
