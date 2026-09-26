#!/usr/bin/env bash
# Convergent release steps for `wonder-wagon-ui`, used by
# .github/workflows/release-foundation.yml.
#
# Two modes, chosen by `plan` from the registry:
#
#   new       npm lacks the version. The release commit is $GITHUB_SHA, which
#             must be the tip of origin/main. The workspace is built,
#             verified and published; the registry must then serve it with
#             gitHead $GITHUB_SHA and the verified integrity.
#   recovery  npm already has the version (a run published it and failed
#             later). The registry's gitHead for that version is the release
#             commit, whatever main is now. That commit is fetched from origin,
#             must be on main, and is rebuilt in a detached worktree whose
#             pack must equal the registry's integrity. Nothing is published.
#
# In both modes the tag and GitHub Release are created, if absent, at the
# release commit, and only after the registry has been read back. So
# re-dispatch after any post-publish partial failure is safe even if main has
# advanced.
#
#   plan      decide mode, release commit and what exists; write outputs.
#   prepare   recovery only: check the release commit out into $RELEASE_TREE.
#   verify    in $TREE: version, the commit's own allowlist, pack integrity.
#   readback  wait for the registry to serve the version from $RELEASE_SHA.
#   tag       create and push the annotated tag at $RELEASE_SHA.
#   release   create the GitHub Release from that tag.
#
# NPM_REGISTRY and READBACK_* exist for the tests only; the workflow never
# sets them.

set -euo pipefail

PACKAGE=wonder-wagon-ui
REGISTRY="${NPM_REGISTRY:-https://registry.npmjs.org}"
TAG="$PACKAGE@${RELEASE_VERSION:?RELEASE_VERSION is required}"
: "${GITHUB_SHA:?GITHUB_SHA is required}"

fail() {
  echo "::error::$*"
  exit 1
}

plan() {
  printf '%s' "$RELEASE_VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' ||
    fail "'$RELEASE_VERSION' is not a MAJOR.MINOR.PATCH version"

  # The package document, not the version URL: asking for a version before it
  # exists would seed a cached 404 for exactly the URL readback polls.
  local status
  status="$(curl -s --max-time 10 -o packument.json -w '%{http_code}' "$REGISTRY/$PACKAGE" || true)"
  if [ "$status" != "200" ]; then
    rm -f packument.json
    fail "the registry answered ${status:-000} for $PACKAGE"
  fi
  local entry
  entry="$(node -e '
    const doc = require("./packument.json").versions?.[process.argv[1]];
    if (doc) process.stdout.write(`${doc.gitHead ?? ""} ${doc.dist?.integrity ?? ""}`);
  ' "$RELEASE_VERSION")"
  rm -f packument.json

  git fetch --quiet origin main || fail "cannot fetch origin main"
  local main mode release_sha registry_integrity="" published tree
  main="$(git rev-parse origin/main)"

  if [ -z "$entry" ]; then
    mode=new
    published=no
    release_sha="$GITHUB_SHA"
    [ "$GITHUB_SHA" = "$main" ] ||
      fail "$PACKAGE@$RELEASE_VERSION is not on npm, so this is a new release, and a new release" \
           "must come from the tip of main ($main), not $GITHUB_SHA. Re-dispatch after main settles."
    tree="$PWD"
  else
    mode=recovery
    published=yes
    release_sha="${entry%% *}"
    registry_integrity="${entry#* }"
    # The registry is the recovery authority, never a tag or current main.
    printf '%s' "$release_sha" | grep -Eq '^[0-9a-f]{40}$' ||
      fail "$PACKAGE@$RELEASE_VERSION is on npm without a gitHead, so its release commit is unknown." \
           "Nothing will be tagged or released."
    [ -n "$registry_integrity" ] || fail "$PACKAGE@$RELEASE_VERSION is on npm without an integrity"
    echo "::notice::$PACKAGE@$RELEASE_VERSION is already on npm from $release_sha; recovering without publishing"
    git fetch --quiet --no-tags origin "$release_sha" ||
      fail "cannot fetch the registry's release commit $release_sha from origin"
    git merge-base --is-ancestor "$release_sha" "$main" ||
      fail "the registry's release commit $release_sha is not on this repository's main"
    tree="${RELEASE_TREE:?RELEASE_TREE is required}"
  fi

  local tagged=no remote
  remote="$(git ls-remote --tags origin "refs/tags/$TAG" "refs/tags/$TAG^{}")"
  if [ -n "$remote" ]; then
    tagged=yes
    # An annotated tag lists its peeled commit as ^{}; a lightweight one does not.
    local commit
    commit="$(printf '%s\n' "$remote" | awk '/\^\{\}$/ { print $1 }')"
    [ -n "$commit" ] || commit="$(printf '%s\n' "$remote" | awk '{ print $1 }')"
    [ "$commit" = "$release_sha" ] ||
      fail "tag $TAG already points at $commit, not the release commit $release_sha"
    echo "::notice::tag $TAG already exists at $release_sha; tagging will be skipped"
  fi

  local released=no
  if gh release view "$TAG" >/dev/null 2>&1; then
    released=yes
    echo "::notice::GitHub Release $TAG already exists; it will be left alone"
  fi

  local complete=no
  if [ "$published$tagged$released" = "yesyesyes" ]; then
    complete=yes
    echo "::notice::$TAG is already published, tagged and released. Nothing to do."
  fi

  {
    echo "mode=$mode"
    echo "release_sha=$release_sha"
    echo "registry_integrity=$registry_integrity"
    echo "tree=$tree"
    echo "published=$published"
    echo "tagged=$tagged"
    echo "released=$released"
    echo "complete=$complete"
  } >> "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"
  echo "plan: mode=$mode release_sha=$release_sha published=$published tagged=$tagged released=$released complete=$complete"
}

prepare() {
  : "${RELEASE_SHA:?RELEASE_SHA is required}" "${RELEASE_TREE:?RELEASE_TREE is required}"
  git worktree add --quiet --detach "$RELEASE_TREE" "$RELEASE_SHA"
  [ "$(git -C "$RELEASE_TREE" rev-parse HEAD)" = "$RELEASE_SHA" ] ||
    fail "the release tree is not at $RELEASE_SHA"
  echo "release tree $RELEASE_TREE is at $RELEASE_SHA"
}

verify() {
  local dir="${TREE:?TREE is required}/packages/foundation"
  local actual
  actual="$(node -p 'require(process.argv[1]).version' "$dir/package.json")"
  [ "$actual" = "$RELEASE_VERSION" ] ||
    fail "requested $RELEASE_VERSION but package.json contains $actual"
  # The release commit's own allowlist: each version is held to the file list
  # it was built with.
  [ -f "$dir/scripts/verify-pack.mjs" ] ||
    fail "the release commit has no packages/foundation/scripts/verify-pack.mjs, so its" \
         "allowlist cannot be checked here"
  local pack
  pack="$(mktemp)"
  (cd "$dir" && npm pack --dry-run --json > "$pack")
  node "$dir/scripts/verify-pack.mjs" < "$pack"
  local integrity
  integrity="$(node -e '
    const output = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    const [report] = Array.isArray(output) ? output : Object.values(output);
    process.stdout.write(report.integrity);
  ' "$pack")"
  rm -f "$pack"
  echo "verified pack integrity: $integrity"
  # The pack is deterministic, so a rebuild must reproduce the registry's bytes.
  if [ -n "${REGISTRY_INTEGRITY:-}" ] && [ "$integrity" != "$REGISTRY_INTEGRITY" ]; then
    fail "the rebuilt pack's integrity $integrity is not the registry's $REGISTRY_INTEGRITY." \
         "Nothing will be tagged or released."
  fi
  echo "integrity=$integrity" >> "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"
}

readback() {
  : "${RELEASE_SHA:?RELEASE_SHA is required}"
  # A fresh version can take minutes to appear. Ask at once, then every
  # 10 seconds, for at most 60 attempts or 600 seconds, and stop as soon as it
  # answers. A 404 here is expected, so it is logged rather than shown as a
  # curl error.
  local url="$REGISTRY/$PACKAGE/$RELEASE_VERSION"
  local interval="${READBACK_INTERVAL:-10}"
  local attempts="${READBACK_ATTEMPTS:-60}"
  local limit="${READBACK_LIMIT:-600}"
  local start=$SECONDS status elapsed attempt
  rm -f version.json
  for attempt in $(seq 1 "$attempts"); do
    status="$(curl -s --max-time 10 -o version.json -w '%{http_code}' "$url" || true)"
    elapsed=$((SECONDS - start))
    if [ "$status" = "200" ] && [ -s version.json ]; then
      echo "attempt $attempt/$attempts: visible after ${elapsed}s"
      break
    fi
    rm -f version.json
    echo "attempt $attempt/$attempts: HTTP ${status:-000}, not visible yet (${elapsed}s of ${limit}s)"
    if [ "$attempt" -eq "$attempts" ] || [ $((elapsed + interval)) -gt "$limit" ]; then
      break
    fi
    sleep "$interval"
  done
  [ -s version.json ] ||
    fail "$PACKAGE@$RELEASE_VERSION never appeared on the registry within ${limit}s." \
         "Nothing was tagged or released. Investigate, then re-dispatch."

  # npm records gitHead for every publish from a git checkout, and this
  # workflow only publishes from one. A missing gitHead means the version did
  # not come from here, so it is refused like a wrong one.
  local head integrity
  head="$(node -p 'require("./version.json").gitHead || ""')"
  integrity="$(node -p 'require("./version.json").dist?.integrity || ""')"
  rm -f version.json
  echo "registry gitHead: ${head:-<absent>}"
  [ "$head" = "$RELEASE_SHA" ] ||
    fail "the registry's $PACKAGE@$RELEASE_VERSION has gitHead '${head:-<absent>}'," \
         "not the release commit $RELEASE_SHA. Do not tag this. A wrong version can only be superseded."
  echo "registry integrity: $integrity"
  [ "$integrity" = "${EXPECTED_INTEGRITY:?EXPECTED_INTEGRITY is required}" ] ||
    fail "the registry's tarball integrity $integrity is not the verified pack's $EXPECTED_INTEGRITY." \
         "Do not tag this."
  echo "$PACKAGE@$RELEASE_VERSION is live and matches $RELEASE_SHA."
}

tag() {
  : "${RELEASE_SHA:?RELEASE_SHA is required}"
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git tag -a "$TAG" -m "$TAG — released by .github/workflows/release-foundation.yml" "$RELEASE_SHA"
  git push origin "refs/tags/$TAG"
}

release() {
  gh release create "$TAG" \
    --verify-tag \
    --title "$PACKAGE $RELEASE_VERSION" \
    --notes-file "${TREE:?TREE is required}/packages/foundation/CHANGELOG.md"
}

case "${1:-}" in
  plan | prepare | verify | readback | tag | release) "$1" ;;
  *)
    echo "usage: $0 plan|prepare|verify|readback|tag|release" >&2
    exit 2
    ;;
esac
