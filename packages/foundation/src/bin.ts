#!/usr/bin/env node
/**
 * `npx wonder-wagon-ui`: the family doorway. It runs only when a person asks;
 * the package has no install scripts. Piped output is the plain roster.
 */

import { readFileSync } from "node:fs";
import { detectTerminal } from "./cli.js";
import { renderDoorway, renderRoster } from "./doorway.js";

const USAGE = "Usage: npx wonder-wagon-ui [--help | --version]\n";

const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

// A reader that closes the pipe early is not an error.
process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EPIPE") process.exit(0);
  throw error;
});

const [argument, ...rest] = process.argv.slice(2);

if (
  rest.length > 0 ||
  (argument !== undefined && !["-h", "--help", "-v", "--version"].includes(argument))
) {
  process.stderr.write(
    `wonder-wagon-ui: unknown argument ${JSON.stringify(rest[0] ?? argument)}\n${USAGE}`,
  );
  process.exitCode = 2;
} else if (argument === "-v" || argument === "--version") {
  process.stdout.write(`${version}\n`);
} else {
  const caps = detectTerminal({
    env: process.env,
    isTTY: process.stdout.isTTY === true,
    columns: process.stdout.columns,
    platform: process.platform,
  });
  process.stdout.write(
    caps.tier === "contract" ? renderRoster(version) : renderDoorway({ version, caps }),
  );
}
