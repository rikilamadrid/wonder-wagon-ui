import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("package exports are generated from the component tree", () => {
  it("write-exports --check passes", () => {
    const out = execFileSync(
      process.execPath,
      [join(__dirname, "..", "..", "scripts", "write-exports.mjs"), "--check"],
      { encoding: "utf8" },
    );
    expect(out).toContain("current");
  });
});
