// Tests for release-foundation.sh and the order release-foundation.yml runs
// it in. Run: node --test .github/scripts/release-foundation.test.mjs
//
// Each test drives the real script against a local fake registry, a real bare
// git remote holding a small `wonder-wagon-ui` package, and a `gh` stub on
// PATH. `dispatch` replays one workflow run using the workflow's own step
// conditions, which the last test pins to the YAML, so the recovery paths
// below are the paths a real re-dispatch takes. Packs are real `npm pack`
// runs, so integrity comparisons compare real bytes.

import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
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

let ctx;

/** A registry whose answers each test scripts. */
function fakeRegistry() {
  const state = {
    // The published version document, or null.
    doc: null,
    // Answers for the version URL once published: "404" or "200", in order;
    // the last one repeats.
    answers: ["200"],
    versionRequests: 0,
  };
  const server = createServer((req, res) => {
    if (req.url === "/wonder-wagon-ui") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ versions: state.doc ? { [VERSION]: state.doc } : {} }));
      return;
    }
    if (req.url === `/wonder-wagon-ui/${VERSION}`) {
      const answer = state.doc
        ? state.answers[Math.min(state.versionRequests, state.answers.length - 1)]
        : "404";
      state.versionRequests += 1;
      if (answer !== "200") {
        res.writeHead(404);
        res.end('"version not found"');
        return;
      }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(state.doc));
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

/** Commit a change to the package's own bytes and push it to main. */
function advanceMain(label) {
  writeFileSync(
    join(ctx.work, "packages", "foundation", "index.js"),
    `export const build = ${JSON.stringify(label)};\n`,
  );
  git(ctx.work, "commit", "--quiet", "-am", label);
  git(ctx.work, "push", "--quiet", "origin", "HEAD:main");
  return git(ctx.work, "rev-parse", "HEAD");
}

/** The integrity `npm pack` gives the package at `sha`. */
function integrityAt(sha) {
  const dir = mkdtempSync(join(ctx.root, "pack-"));
  rmSync(dir, { recursive: true });
  execFileSync("git", ["-C", ctx.work, "worktree", "add", "--quiet", "--detach", dir, sha]);
  const output = JSON.parse(
    execFileSync("npm", ["pack", "--dry-run", "--json"], {
      cwd: join(dir, "packages", "foundation"),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
  execFileSync("git", ["-C", ctx.work, "worktree", "remove", "--force", dir]);
  const [report] = Array.isArray(output) ? output : Object.values(output);
  return report.integrity;
}

/** What `npm publish` from `sha` leaves on the registry. */
function publishedFrom(sha) {
  return { version: VERSION, gitHead: sha, dist: { integrity: integrityAt(sha) } };
}

beforeEach(async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ww-release-")));
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
  const foundation = join(work, "packages", "foundation");
  mkdirSync(join(foundation, "scripts"), { recursive: true });
  writeFileSync(
    join(foundation, "package.json"),
    `${JSON.stringify({ name: "wonder-wagon-ui", version: VERSION, files: ["index.js"] }, null, 2)}\n`,
  );
  writeFileSync(join(foundation, "index.js"), 'export const build = "release";\n');
  writeFileSync(join(foundation, "CHANGELOG.md"), "# wonder-wagon-ui\n");
  // Each commit's own allowlist: exactly the files this package ships.
  writeFileSync(
    join(foundation, "scripts", "verify-pack.mjs"),
    `import { readFileSync } from "node:fs";
const output = JSON.parse(readFileSync(0, "utf8"));
const [report] = Array.isArray(output) ? output : Object.values(output);
const files = report.files.map((f) => f.path).sort().join(",");
if (files !== "index.js,package.json") throw new Error("unexpected tarball files: " + files);
`,
  );
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
  ctx = { root, origin, work, gh, sha, registry, bin, tree: join(root, "release-tree") };
});

afterEach(() => {
  ctx.registry.server.close();
  rmSync(ctx.root, { recursive: true, force: true });
});

/** Run one subcommand of the real script; resolves with its exit code, log and outputs. */
function step(name, env = {}) {
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
        RELEASE_TREE: ctx.tree,
        ...env,
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
          .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
      );
      resolve({ code, log, outputs });
    });
  });
}

/**
 * One workflow run: the workflow's step order, `if:` conditions and env,
 * stopping at the first failed step as Actions does. `publish` stands in for
 * `npm publish` from the workspace, which records the workspace commit as
 * gitHead. `onPublish` lets a test tamper with what the registry then holds.
 */
async function dispatch({ env = {}, onPublish } = {}) {
  const ran = [];
  const logs = [];
  const run = async (name, extra) => {
    const result = await step(name, { ...env, ...extra });
    ran.push(name);
    logs.push(result.log);
    return result;
  };
  const done = (extra) => ({ ran, log: logs.join("\n"), ...extra });

  const plan = await run("plan");
  if (plan.code !== 0) return done({ failed: "plan" });
  const out = plan.outputs;
  if (out.complete !== "no") return done({ plan: out });
  if (out.mode === "recovery") {
    const prepared = await run("prepare", { RELEASE_SHA: out.release_sha, RELEASE_TREE: out.tree });
    if (prepared.code !== 0) return done({ failed: "prepare", plan: out });
  }
  const verify = await run("verify", {
    TREE: out.tree,
    REGISTRY_INTEGRITY: out.registry_integrity,
  });
  if (verify.code !== 0) return done({ failed: "verify", plan: out });
  if (out.mode === "new") {
    ran.push("publish");
    ctx.registry.state.doc = publishedFrom(env.GITHUB_SHA ?? ctx.sha);
    onPublish?.(ctx.registry.state);
  }
  const readback = await run("readback", {
    RELEASE_SHA: out.release_sha,
    EXPECTED_INTEGRITY: verify.outputs.integrity,
  });
  if (readback.code !== 0) return done({ failed: "readback", plan: out });
  if (out.tagged === "no") {
    const tagged = await run("tag", { RELEASE_SHA: out.release_sha });
    if (tagged.code !== 0) return done({ failed: "tag", plan: out });
  }
  if (out.released === "no") {
    const created = await run("release", { TREE: out.tree });
    if (created.code !== 0) return done({ failed: "release", plan: out });
  }
  return done({ plan: out });
}

/** The commit the remote tag resolves to, or "" when there is no tag. */
function remoteTagCommit() {
  const lines = git(
    ctx.work,
    "ls-remote",
    "--tags",
    "origin",
    `refs/tags/${TAG}`,
    `refs/tags/${TAG}^{}`,
  );
  if (lines === "") return "";
  const peeled = lines.split("\n").find((line) => line.endsWith("^{}"));
  return (peeled ?? lines).split(/\s+/)[0];
}
const released = () => existsSync(join(ctx.gh, "released"));
const releaseArgs = () => readFileSync(join(ctx.gh, "create-args"), "utf8").split("\n");

function tagAt(sha, { annotated = true } = {}) {
  if (annotated) git(ctx.work, "tag", "-a", TAG, "-m", TAG, sha);
  else git(ctx.work, "tag", TAG, sha);
  git(ctx.work, "push", "--quiet", "origin", `refs/tags/${TAG}`);
}

// ─── new release ────────────────────────────────────────────────────────────

test("new: an absent version is planned as a new release of the tip of main", async () => {
  const { code, outputs } = await step("plan");
  assert.equal(code, 0);
  assert.equal(outputs.mode, "new");
  assert.equal(outputs.release_sha, ctx.sha);
  assert.equal(outputs.tree, ctx.work);
  assert.deepEqual(
    [outputs.published, outputs.tagged, outputs.released, outputs.complete],
    ["no", "no", "no", "no"],
  );
});

test("new: an unpublished version still requires the current tip of main", async () => {
  const stale = ctx.sha;
  advanceMain("later");
  const run = await dispatch({ env: { GITHUB_SHA: stale } });
  assert.equal(run.failed, "plan");
  assert.match(run.log, /must come from the tip of main/);
  assert.equal(ctx.registry.state.doc, null, "nothing was published");
});

test("new: plan asks for the package document, never the version URL", async () => {
  await step("plan");
  assert.equal(ctx.registry.state.versionRequests, 0);
});

test("new: publish, read back, annotated tag at the release commit, then release", async () => {
  const run = await dispatch();
  assert.deepEqual(run.ran, ["plan", "verify", "publish", "readback", "tag", "release"]);
  assert.match(run.log, /attempt 1\/60: visible after \d+s/);
  assert.equal(remoteTagCommit(), ctx.sha);
  assert.equal(git(ctx.work, "cat-file", "-t", `refs/tags/${TAG}`), "tag");
  const args = releaseArgs();
  assert.deepEqual(args.slice(0, 7), [
    "release",
    "create",
    TAG,
    "--verify-tag",
    "--title",
    `wonder-wagon-ui ${VERSION}`,
    "--notes-file",
  ]);
  assert.equal(args[7], join(ctx.work, "packages", "foundation", "CHANGELOG.md"));
});

test("new: a 404, 404, 200 propagation is waited out and continues at once", async () => {
  ctx.registry.state.answers = ["404", "404", "200"];
  const run = await dispatch();
  assert.deepEqual(run.ran, ["plan", "verify", "publish", "readback", "tag", "release"]);
  assert.match(run.log, /attempt 1\/60: HTTP 404, not visible yet \(\d+s of 600s\)/);
  assert.match(run.log, /attempt 3\/60: visible after \d+s/);
  assert.doesNotMatch(run.log, /curl: \(/);
  assert.equal(ctx.registry.state.versionRequests, 3);
});

test("new: a version that never appears is neither tagged nor released", async () => {
  ctx.registry.state.answers = ["404"];
  const run = await dispatch({ env: { READBACK_ATTEMPTS: "3" } });
  assert.equal(run.failed, "readback");
  assert.match(run.log, /never appeared on the registry within 600s/);
  assert.equal(remoteTagCommit(), "");
  assert.equal(released(), false);
});

test("new: the readback window stops at its time limit", async () => {
  ctx.registry.state.doc = publishedFrom(ctx.sha);
  ctx.registry.state.answers = ["404"];
  const { code, log } = await step("readback", {
    RELEASE_SHA: ctx.sha,
    EXPECTED_INTEGRITY: "x",
    READBACK_LIMIT: "2",
  });
  assert.equal(code, 1);
  assert.match(log, /within 2s/);
  assert.ok(ctx.registry.state.versionRequests <= 3);
});

test("new: a wrong or missing gitHead after publish is neither tagged nor released", async () => {
  for (const gitHead of ["0000000000000000000000000000000000000000", undefined]) {
    ctx.registry.state.doc = null;
    const run = await dispatch({
      onPublish: (state) => {
        state.doc.gitHead = gitHead;
      },
    });
    assert.equal(run.failed, "readback");
    assert.match(run.log, /not the release commit/);
    assert.equal(remoteTagCommit(), "");
    assert.equal(released(), false);
  }
});

test("new: registry bytes that differ from the verified pack are refused", async () => {
  const run = await dispatch({
    onPublish: (state) => {
      state.doc.dist.integrity = "sha512-other";
    },
  });
  assert.equal(run.failed, "readback");
  assert.match(run.log, /integrity/);
  assert.equal(remoteTagCommit(), "");
});

test("new: a malformed version is refused", async () => {
  const { code, log } = await step("plan", { RELEASE_VERSION: "v1.2" });
  assert.equal(code, 1);
  assert.match(log, /not a MAJOR\.MINOR\.PATCH version/);
});

// ─── recovery ───────────────────────────────────────────────────────────────

test("recovery: publish succeeded, main advanced, no tag or release → completed from the registry's gitHead", async () => {
  const releaseSha = ctx.sha;
  ctx.registry.state.answers = ["404"];
  const first = await dispatch({ env: { READBACK_ATTEMPTS: "2" } });
  assert.deepEqual(first.ran, ["plan", "verify", "publish", "readback"]);
  assert.equal(first.failed, "readback");

  const head = advanceMain("main moved on");
  ctx.registry.state.answers = ["200"];
  const second = await dispatch({ env: { GITHUB_SHA: head } });
  assert.equal(second.plan.mode, "recovery");
  assert.equal(second.plan.release_sha, releaseSha);
  assert.deepEqual(second.ran, ["plan", "prepare", "verify", "readback", "tag", "release"]);
  assert.equal(remoteTagCommit(), releaseSha, "the tag is on the published commit, not on main");
  assert.equal(releaseArgs()[7], join(ctx.tree, "packages", "foundation", "CHANGELOG.md"));
  assert.equal(git(ctx.tree, "rev-parse", "HEAD"), releaseSha);
});

test("recovery: main advanced past the package's bytes, and the historical rebuild matches the registry", async () => {
  const releaseSha = ctx.sha;
  ctx.registry.state.doc = publishedFrom(releaseSha);
  const head = advanceMain("different package bytes");
  assert.notEqual(
    integrityAt(head),
    ctx.registry.state.doc.dist.integrity,
    "main alone could not match",
  );
  const run = await dispatch({ env: { GITHUB_SHA: head } });
  assert.equal(run.plan.mode, "recovery");
  assert.deepEqual(run.ran, ["plan", "prepare", "verify", "readback", "tag", "release"]);
  assert.ok(run.log.includes(`verified pack integrity: ${ctx.registry.state.doc.dist.integrity}`));
  assert.equal(remoteTagCommit(), releaseSha);
  assert.equal(released(), true);
});

test("recovery: a registry gitHead that cannot be fetched from origin fails", async () => {
  ctx.registry.state.doc = {
    ...publishedFrom(ctx.sha),
    gitHead: "1234567890abcdef1234567890abcdef12345678",
  };
  const run = await dispatch();
  assert.equal(run.failed, "plan");
  assert.match(run.log, /cannot fetch the registry's release commit/);
  assert.equal(remoteTagCommit(), "");
  assert.equal(released(), false);
});

test("recovery: a registry gitHead that is not on main fails", async () => {
  git(ctx.work, "checkout", "--quiet", "-b", "side");
  writeFileSync(
    join(ctx.work, "packages", "foundation", "index.js"),
    'export const build = "side";\n',
  );
  git(ctx.work, "commit", "--quiet", "-am", "side branch");
  git(ctx.work, "push", "--quiet", "origin", "HEAD:side");
  const side = git(ctx.work, "rev-parse", "HEAD");
  git(ctx.work, "checkout", "--quiet", "main");
  ctx.registry.state.doc = publishedFrom(side);
  const run = await dispatch();
  assert.equal(run.failed, "plan");
  assert.match(run.log, /is not on this repository's main/);
});

test("recovery: a missing registry gitHead fails before anything else", async () => {
  const doc = publishedFrom(ctx.sha);
  delete doc.gitHead;
  ctx.registry.state.doc = doc;
  const run = await dispatch();
  assert.equal(run.failed, "plan");
  assert.match(run.log, /without a gitHead/);
  assert.equal(remoteTagCommit(), "");
});

test("recovery: a historical rebuild whose integrity differs from the registry fails", async () => {
  ctx.registry.state.doc = {
    ...publishedFrom(ctx.sha),
    dist: { integrity: "sha512-not-these-bytes" },
  };
  const head = advanceMain("later");
  const run = await dispatch({ env: { GITHUB_SHA: head } });
  assert.equal(run.failed, "verify");
  assert.match(run.log, /is not the registry's sha512-not-these-bytes/);
  assert.equal(remoteTagCommit(), "");
  assert.equal(released(), false);
});

test("recovery: an existing tag on any commit but the release commit fails", async () => {
  ctx.registry.state.doc = publishedFrom(ctx.sha);
  const head = advanceMain("later");
  tagAt(head);
  const run = await dispatch({ env: { GITHUB_SHA: head } });
  assert.equal(run.failed, "plan");
  assert.match(run.log, /already points at .* not the release commit/);
  assert.equal(released(), false);
});

test("recovery: tagged but unreleased creates only the release", async () => {
  ctx.registry.state.doc = publishedFrom(ctx.sha);
  tagAt(ctx.sha);
  const head = advanceMain("later");
  const run = await dispatch({ env: { GITHUB_SHA: head } });
  assert.deepEqual(run.ran, ["plan", "prepare", "verify", "readback", "release"]);
  assert.equal(released(), true);
});

test("recovery: a lightweight tag at the release commit is accepted as existing", async () => {
  ctx.registry.state.doc = publishedFrom(ctx.sha);
  tagAt(ctx.sha, { annotated: false });
  const { code, outputs } = await step("plan");
  assert.equal(code, 0);
  assert.equal(outputs.tagged, "yes");
});

test("recovery: a fully complete release is a no-op, even after main advanced", async () => {
  ctx.registry.state.doc = publishedFrom(ctx.sha);
  tagAt(ctx.sha);
  writeFileSync(join(ctx.gh, "released"), "");
  const head = advanceMain("later");
  const run = await dispatch({ env: { GITHUB_SHA: head } });
  assert.deepEqual(run.ran, ["plan"]);
  assert.equal(run.plan.complete, "yes");
  assert.equal(ctx.registry.state.versionRequests, 0);
  assert.equal(existsSync(ctx.tree), false);
});

// ─── the workflow itself ────────────────────────────────────────────────────

test("the workflow runs these steps in this order under these conditions", () => {
  const text = readFileSync(WORKFLOW, "utf8");
  const steps = [...text.matchAll(/^ {6}- .*\n(?: {8}.*\n)*/gm)].map((match) => {
    const block = match[0];
    const env = Object.fromEntries(
      [...block.matchAll(/^ {10}([A-Z_]+): (.+)$/gm)].map((m) => [m[1], m[2]]),
    );
    return {
      name: /^ {6}- name: (.+)$/m.exec(block)?.[1] ?? "",
      if: /^ {6}- if: (.+)$|^ {8}if: (.+)$/m.exec(block)?.slice(1).find(Boolean) ?? "",
      run: /^ {8}run: (.+)$/m.exec(block)?.[1] ?? "",
      wd: /^ {8}working-directory: (.+)$/m.exec(block)?.[1] ?? "",
      env,
    };
  });
  const named = (name) => {
    const found = steps.find((s) => s.name === name);
    assert.ok(found, `step "${name}" exists`);
    return found;
  };
  const order = [
    "Plan the release",
    "Check out the published release commit for recovery",
    "Build and verify the exact release commit",
    "Verify version and packed allowlist",
    "Publish with npm trusted publishing",
    "Confirm the registry serves this version from the release commit",
    "Tag the release commit",
    "Create the GitHub Release",
  ].map((name) => steps.indexOf(named(name)));
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
    "release steps run in this order",
  );

  const incomplete = "steps.plan.outputs.complete == 'no'";
  const gha = (inner) => `\${{ ${inner} }}`;
  const expr = (output) => gha(`steps.plan.outputs.${output}`);

  const plan = named("Plan the release");
  assert.equal(plan.if, "");
  assert.equal(plan.run, ".github/scripts/release-foundation.sh plan");
  assert.equal(plan.env.RELEASE_TREE, `${gha("runner.temp")}/release-tree`);

  const prepare = named("Check out the published release commit for recovery");
  assert.equal(prepare.if, `${incomplete} && steps.plan.outputs.mode == 'recovery'`);
  assert.equal(prepare.env.RELEASE_SHA, expr("release_sha"));

  assert.equal(named("Build and verify the exact release commit").wd, expr("tree"));
  assert.equal(steps.find((s) => s.run === "bun install --frozen-lockfile").wd, expr("tree"));

  const verify = named("Verify version and packed allowlist");
  assert.equal(verify.if, incomplete);
  assert.equal(verify.env.TREE, expr("tree"));
  assert.equal(verify.env.REGISTRY_INTEGRITY, expr("registry_integrity"));

  const publish = named("Publish with npm trusted publishing");
  assert.equal(publish.if, `${incomplete} && steps.plan.outputs.mode == 'new'`);
  assert.equal(publish.run, "npm publish --access public --provenance");
  assert.equal(
    publish.wd,
    "packages/foundation",
    "publish runs from the workspace, never the recovery tree",
  );

  const readback = named("Confirm the registry serves this version from the release commit");
  assert.equal(readback.if, incomplete);
  assert.equal(readback.env.RELEASE_SHA, expr("release_sha"));
  assert.equal(readback.env.EXPECTED_INTEGRITY, gha("steps.verify.outputs.integrity"));

  const tag = named("Tag the release commit");
  assert.equal(tag.if, `${incomplete} && steps.plan.outputs.tagged == 'no'`);
  assert.equal(tag.env.RELEASE_SHA, expr("release_sha"));

  const release = named("Create the GitHub Release");
  assert.equal(release.if, `${incomplete} && steps.plan.outputs.released == 'no'`);
  assert.equal(release.env.TREE, expr("tree"));

  assert.doesNotMatch(
    text,
    /NPM_REGISTRY|READBACK_/,
    "the workflow never overrides the test knobs",
  );
  assert.match(text, /id-token: write/);
  assert.match(text, /if: github\.ref == 'refs\/heads\/main'/);
  assert.doesNotMatch(text, /NODE_AUTH_TOKEN|NPM_TOKEN|^\s+registry-url:/m);
});
