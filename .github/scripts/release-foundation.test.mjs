// Tests for release-foundation.sh and the order release-foundation.yml runs
// it in. Run: node --test .github/scripts/release-foundation.test.mjs
//
// Each test drives the real script against a local fake registry, a real bare
// git remote, and a `gh` stub on PATH. `dispatch` replays one workflow run
// using the workflow's own step conditions, which the last test pins to the
// YAML, so the recovery paths below are the paths a real re-dispatch takes.

import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, "release-foundation.sh");
const WORKFLOW = join(HERE, "..", "workflows", "release-foundation.yml");
const VERSION = "9.8.7";
const TAG = `wonder-wagon-ui@${VERSION}`;
const INTEGRITY = "sha512-verified";

let ctx;

/** A registry whose answers each test scripts. */
function fakeRegistry() {
  const state = {
    published: false,
    // Answers for the version URL once published: "404" or "200", in order;
    // the last one repeats.
    answers: ["200"],
    gitHead: undefined,
    integrity: INTEGRITY,
    versionRequests: 0,
  };
  const server = createServer((req, res) => {
    if (req.url === "/wonder-wagon-ui") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ versions: state.published ? { [VERSION]: {} } : {} }));
      return;
    }
    if (req.url === `/wonder-wagon-ui/${VERSION}`) {
      const answer = state.published
        ? state.answers[Math.min(state.versionRequests, state.answers.length - 1)]
        : "404";
      state.versionRequests += 1;
      if (answer !== "200") {
        res.writeHead(404);
        res.end('"version not found"');
        return;
      }
      const doc = { version: VERSION, dist: { integrity: state.integrity } };
      if (state.gitHead !== undefined) doc.gitHead = state.gitHead;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(doc));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () =>
      resolve({ state, server, url: `http://127.0.0.1:${server.address().port}` }),
    );
  });
}

function git(cwd, ...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

beforeEach(async () => {
  const root = mkdtempSync(join(tmpdir(), "ww-release-"));
  const origin = join(root, "origin.git");
  const work = join(root, "work");
  const bin = join(root, "bin");
  const gh = join(root, "gh");
  mkdirSync(bin);
  mkdirSync(gh);
  git(root, "init", "--quiet", "--bare", origin);
  git(root, "clone", "--quiet", origin, work);
  git(work, "config", "user.name", "test");
  git(work, "config", "user.email", "test@example.com");
  mkdirSync(join(work, "packages", "foundation"), { recursive: true });
  writeFileSync(join(work, "packages", "foundation", "CHANGELOG.md"), "# wonder-wagon-ui\n");
  git(work, "add", ".");
  git(work, "commit", "--quiet", "-m", "release commit");
  git(work, "push", "--quiet", "origin", "HEAD:main");
  const sha = git(work, "rev-parse", "HEAD");
  // The stub answers `gh release view` from a marker file and records creates.
  writeFileSync(
    join(bin, "gh"),
    `#!/usr/bin/env bash
set -eu
if [ "$1 $2" = "release view" ]; then [ -f "${gh}/released" ]; exit $?; fi
if [ "$1 $2" = "release create" ]; then printf '%s\\n' "$@" > "${gh}/create-args"; touch "${gh}/released"; exit 0; fi
exit 3
`,
  );
  chmodSync(join(bin, "gh"), 0o755);
  const registry = await fakeRegistry();
  ctx = { root, origin, work, gh, sha, registry, bin };
});

afterEach(() => {
  ctx.registry.server.close();
  rmSync(ctx.root, { recursive: true, force: true });
});

/** Run one subcommand of the real script; resolves with its exit code and output. */
function step(name, extraEnv = {}) {
  const output = join(ctx.root, `output-${name}-${Date.now()}-${Math.random()}`);
  writeFileSync(output, "");
  return new Promise((resolve) => {
    const child = spawn("bash", [SCRIPT, name], {
      cwd: ctx.work,
      env: {
        PATH: `${ctx.bin}:${process.env.PATH}`,
        HOME: ctx.root,
        RELEASE_VERSION: VERSION,
        GITHUB_SHA: ctx.sha,
        GITHUB_OUTPUT: output,
        GH_TOKEN: "test",
        NPM_REGISTRY: ctx.registry.url,
        READBACK_INTERVAL: "1",
        ...extraEnv,
      },
    });
    let log = "";
    child.stdout.on("data", (chunk) => {
      log += chunk;
    });
    child.stderr.on("data", (chunk) => {
      log += chunk;
    });
    child.on("close", (code) => {
      const outputs = Object.fromEntries(
        readFileSync(output, "utf8")
          .split("\n")
          .filter(Boolean)
          .map((line) => line.split("=")),
      );
      resolve({ code, log, outputs });
    });
  });
}

/**
 * One workflow run: the workflow's step order and `if:` conditions, stopping
 * at the first failed step as Actions does. `publish` stands in for
 * `npm publish` by making the fake registry hold the version.
 */
async function dispatch(env = {}) {
  const ran = [];
  const plan = await step("plan", env);
  ran.push("plan");
  if (plan.code !== 0) return { ran, failed: "plan", log: plan.log };
  const { published, tagged, released, complete } = plan.outputs;
  if (complete !== "no") return { ran, plan: plan.outputs };
  if (published === "no") {
    ran.push("publish");
    ctx.registry.state.published = true;
  }
  const readback = await step("readback", { EXPECTED_INTEGRITY: INTEGRITY, ...env });
  ran.push("readback");
  if (readback.code !== 0)
    return { ran, failed: "readback", log: readback.log, plan: plan.outputs };
  if (tagged === "no") {
    const result = await step("tag", env);
    ran.push("tag");
    if (result.code !== 0) return { ran, failed: "tag", log: result.log };
  }
  if (released === "no") {
    const result = await step("release", env);
    ran.push("release");
    if (result.code !== 0) return { ran, failed: "release", log: result.log };
  }
  return { ran, plan: plan.outputs, log: readback.log };
}

const remoteTag = () =>
  git(ctx.work, "ls-remote", "--tags", "origin", `refs/tags/${TAG}`, `refs/tags/${TAG}^{}`);
const released = () => existsSync(join(ctx.gh, "released"));

test("a version absent everywhere is planned for publish, tag and release", async () => {
  const { code, outputs } = await step("plan");
  assert.equal(code, 0);
  assert.deepEqual(outputs, { published: "no", tagged: "no", released: "no", complete: "no" });
});

test("an already published version skips publish", async () => {
  ctx.registry.state.published = true;
  const { code, outputs, log } = await step("plan");
  assert.equal(code, 0);
  assert.equal(outputs.published, "yes");
  assert.match(log, /already on the registry; publish will be skipped/);
});

test("plan asks for the package document, never the version URL", async () => {
  await step("plan");
  assert.equal(ctx.registry.state.versionRequests, 0);
});

test("a fresh run publishes, reads back, tags at the release commit, then releases", async () => {
  ctx.registry.state.gitHead = ctx.sha;
  const run = await dispatch();
  assert.deepEqual(run.ran, ["plan", "publish", "readback", "tag", "release"]);
  assert.match(run.log, /attempt 1\/60: visible after \d+s/);
  const lines = remoteTag().split("\n");
  assert.equal(lines.length, 2, "annotated tags list a peeled ^{} line");
  assert.ok(lines.some((line) => line.startsWith(ctx.sha) && line.endsWith("^{}")));
  const args = readFileSync(join(ctx.gh, "create-args"), "utf8").split("\n");
  assert.deepEqual(args.slice(0, 7), [
    "release",
    "create",
    TAG,
    "--verify-tag",
    "--title",
    `wonder-wagon-ui ${VERSION}`,
    "--notes-file",
  ]);
  assert.equal(args[7], "packages/foundation/CHANGELOG.md");
});

test("a 404, 404, 200 propagation is waited out and continues at once", async () => {
  ctx.registry.state.gitHead = ctx.sha;
  ctx.registry.state.answers = ["404", "404", "200"];
  const run = await dispatch();
  assert.deepEqual(run.ran, ["plan", "publish", "readback", "tag", "release"]);
  assert.match(run.log, /attempt 1\/60: HTTP 404, not visible yet \(\d+s of 600s\)/);
  assert.match(run.log, /attempt 3\/60: visible after \d+s/);
  assert.doesNotMatch(run.log, /curl: \(/);
  assert.equal(ctx.registry.state.versionRequests, 3);
});

test("a version that never appears fails readback and is neither tagged nor released", async () => {
  ctx.registry.state.gitHead = ctx.sha;
  ctx.registry.state.answers = ["404"];
  const run = await dispatch({ READBACK_ATTEMPTS: "3" });
  assert.equal(run.failed, "readback");
  assert.match(run.log, /never appeared on the registry within 600s/);
  assert.equal(remoteTag(), "");
  assert.equal(released(), false);
});

test("the readback window stops at its time limit", async () => {
  ctx.registry.state.published = true;
  ctx.registry.state.answers = ["404"];
  const { code, log } = await step("readback", { READBACK_LIMIT: "2" });
  assert.equal(code, 1);
  assert.match(log, /within 2s/);
  assert.ok(ctx.registry.state.versionRequests <= 3);
});

test("a wrong gitHead is neither tagged nor released", async () => {
  ctx.registry.state.gitHead = "0000000000000000000000000000000000000000";
  const run = await dispatch();
  assert.equal(run.failed, "readback");
  assert.match(run.log, /not the release commit/);
  assert.equal(remoteTag(), "");
  assert.equal(released(), false);
});

test("a missing gitHead is refused like a wrong one", async () => {
  ctx.registry.state.gitHead = undefined;
  const run = await dispatch();
  assert.equal(run.failed, "readback");
  assert.match(run.log, /gitHead '<absent>'/);
  assert.equal(remoteTag(), "");
  assert.equal(released(), false);
});

test("registry bytes that differ from the verified pack are refused", async () => {
  ctx.registry.state.gitHead = ctx.sha;
  ctx.registry.state.integrity = "sha512-other";
  const run = await dispatch();
  assert.equal(run.failed, "readback");
  assert.match(run.log, /integrity/);
  assert.equal(remoteTag(), "");
});

test("published but untagged and unreleased: a re-dispatch completes both without publishing", async () => {
  ctx.registry.state.gitHead = ctx.sha;
  ctx.registry.state.answers = ["404"];
  const first = await dispatch({ READBACK_ATTEMPTS: "2" });
  assert.equal(first.failed, "readback");
  assert.deepEqual(first.ran, ["plan", "publish", "readback"]);

  ctx.registry.state.answers = ["200"];
  const second = await dispatch();
  assert.equal(second.plan.published, "yes");
  assert.deepEqual(second.ran, ["plan", "readback", "tag", "release"]);
  assert.notEqual(remoteTag(), "");
  assert.equal(released(), true);
});

test("tagged but unreleased: a re-dispatch creates only the release", async () => {
  ctx.registry.state.published = true;
  ctx.registry.state.gitHead = ctx.sha;
  git(ctx.work, "tag", "-a", TAG, "-m", TAG, ctx.sha);
  git(ctx.work, "push", "--quiet", "origin", `refs/tags/${TAG}`);
  const run = await dispatch();
  assert.deepEqual(run.ran, ["plan", "readback", "release"]);
  assert.equal(released(), true);
});

test("a lightweight tag at the release commit is accepted as existing", async () => {
  ctx.registry.state.published = true;
  git(ctx.work, "tag", TAG, ctx.sha);
  git(ctx.work, "push", "--quiet", "origin", `refs/tags/${TAG}`);
  const { code, outputs } = await step("plan");
  assert.equal(code, 0);
  assert.equal(outputs.tagged, "yes");
});

test("an existing tag on another commit stops the run before anything else", async () => {
  git(ctx.work, "commit", "--quiet", "--allow-empty", "-m", "later");
  git(ctx.work, "tag", "-a", TAG, "-m", TAG);
  git(ctx.work, "push", "--quiet", "origin", `refs/tags/${TAG}`);
  const run = await dispatch();
  assert.equal(run.failed, "plan");
  assert.match(run.log, /already points at .* not the release commit/);
  assert.equal(released(), false);
});

test("everything already present is a no-op", async () => {
  ctx.registry.state.published = true;
  ctx.registry.state.gitHead = ctx.sha;
  git(ctx.work, "tag", "-a", TAG, "-m", TAG, ctx.sha);
  git(ctx.work, "push", "--quiet", "origin", `refs/tags/${TAG}`);
  writeFileSync(join(ctx.gh, "released"), "");
  const run = await dispatch();
  assert.deepEqual(run.ran, ["plan"]);
  assert.equal(run.plan.complete, "yes");
  assert.equal(ctx.registry.state.versionRequests, 0);
});

test("a malformed version is refused by plan", async () => {
  const { code, log } = await step("plan", { RELEASE_VERSION: "v1.2" });
  assert.equal(code, 1);
  assert.match(log, /not a MAJOR\.MINOR\.PATCH version/);
});

test("the workflow runs these steps in this order under these conditions", () => {
  const text = readFileSync(WORKFLOW, "utf8");
  const steps = [...text.matchAll(/^ {6}- name: (.+)\n(?: {8}.*\n)*/gm)].map((match) => {
    const block = match[0];
    return {
      name: match[1] ?? "",
      if: /^ {8}if: (.+)$/m.exec(block)?.[1] ?? "",
      run: /^ {8}run: (.+)$/m.exec(block)?.[1] ?? "",
    };
  });
  const named = (name) => steps.find((s) => s.name === name);
  const order = [
    "Plan the release",
    "Verify version and packed allowlist",
    "Publish with npm trusted publishing",
    "Confirm the registry serves this version from this commit",
    "Tag the release commit",
    "Create the GitHub Release",
  ].map((name) => steps.indexOf(named(name)));
  assert.ok(
    order.every((index) => index >= 0),
    "every release step exists",
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
    "release steps run in this order",
  );

  assert.equal(named("Plan the release").if, "");
  assert.equal(named("Plan the release").run, ".github/scripts/release-foundation.sh plan");
  assert.equal(
    named("Publish with npm trusted publishing").if,
    "steps.plan.outputs.complete == 'no' && steps.plan.outputs.published == 'no'",
  );
  assert.equal(
    named("Publish with npm trusted publishing").run,
    "npm publish --access public --provenance",
  );
  assert.equal(
    named("Confirm the registry serves this version from this commit").if,
    "steps.plan.outputs.complete == 'no'",
  );
  assert.equal(
    named("Tag the release commit").if,
    "steps.plan.outputs.complete == 'no' && steps.plan.outputs.tagged == 'no'",
  );
  assert.equal(
    named("Create the GitHub Release").if,
    "steps.plan.outputs.complete == 'no' && steps.plan.outputs.released == 'no'",
  );
  assert.match(text, /EXPECTED_INTEGRITY: \$\{\{ steps\.verify\.outputs\.integrity \}\}/);
  assert.doesNotMatch(
    text,
    /NPM_REGISTRY|READBACK_/,
    "the workflow never overrides the test knobs",
  );
  assert.match(text, /id-token: write/);
  assert.doesNotMatch(text, /NODE_AUTH_TOKEN|NPM_TOKEN|^\s+registry-url:/m);
});
