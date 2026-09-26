#!/usr/bin/env bash
# Convergent release steps for `wonder-wagon-ui`, used by
# .github/workflows/release-foundation.yml.
#
#   plan      decide what already exists; write published/tagged/released/
#             complete to $GITHUB_OUTPUT. Mutates nothing.
#   readback  wait for the registry to serve the version, then require its
#             gitHead to be $GITHUB_SHA (and its integrity to match the
#             verified pack, when EXPECTED_INTEGRITY is set).
#   tag       create and push the annotated tag at $GITHUB_SHA.
#   release   create the GitHub Release from the existing tag.
#
# Order in the workflow: plan → verify → publish (if absent) → readback → tag
# (if absent) → release (if absent). Nothing is tagged or released until the
# registry serves the exact version from the exact release commit, so a run
# that dies anywhere is repaired by dispatching it again.
#
# Required env: RELEASE_VERSION, GITHUB_SHA. `plan` also needs GITHUB_OUTPUT
# and GH_TOKEN; `release` needs GH_TOKEN. The READBACK_* and NPM_REGISTRY
# overrides exist for the tests only; the workflow never sets them.

set -euo pipefail

PACKAGE=wonder-wagon-ui
REGISTRY="${NPM_REGISTRY:-https://registry.npmjs.org}"
TAG="$PACKAGE@${RELEASE_VERSION:?RELEASE_VERSION is required}"
: "${GITHUB_SHA:?GITHUB_SHA is required}"

plan() {
  if ! printf '%s' "$RELEASE_VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo "::error::'$RELEASE_VERSION' is not a MAJOR.MINOR.PATCH version"
    exit 1
  fi

  # The package document, not the version URL: asking for a version before it
  # exists would seed a cached 404 for exactly the URL readback polls.
  local status
  status="$(curl -s --max-time 10 -o packument.json -w '%{http_code}' "$REGISTRY/$PACKAGE" || true)"
  if [ "$status" != "200" ]; then
    rm -f packument.json
    echo "::error::the registry answered ${status:-000} for $PACKAGE"
    exit 1
  fi
  local published=no
  if node -e 'process.exit(require("./packument.json").versions?.[process.argv[1]] ? 0 : 1)' "$RELEASE_VERSION"; then
    published=yes
    echo "::notice::$PACKAGE@$RELEASE_VERSION is already on the registry; publish will be skipped"
  fi
  rm -f packument.json

  local tagged=no remote
  remote="$(git ls-remote --tags origin "refs/tags/$TAG" "refs/tags/$TAG^{}")"
  if [ -n "$remote" ]; then
    tagged=yes
    # An annotated tag lists its peeled commit as ^{}; a lightweight one does not.
    local commit
    commit="$(printf '%s\n' "$remote" | awk '/\^\{\}$/ { print $1 }')"
    [ -n "$commit" ] || commit="$(printf '%s\n' "$remote" | awk '{ print $1 }')"
    if [ "$commit" != "$GITHUB_SHA" ]; then
      echo "::error::tag $TAG already points at $commit, not the release commit $GITHUB_SHA"
      exit 1
    fi
    echo "::notice::tag $TAG already exists at $GITHUB_SHA; tagging will be skipped"
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
    echo "published=$published"
    echo "tagged=$tagged"
    echo "released=$released"
    echo "complete=$complete"
  } >> "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"
  echo "plan: published=$published tagged=$tagged released=$released complete=$complete"
}

readback() {
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
  if [ ! -s version.json ]; then
    echo "::error::$PACKAGE@$RELEASE_VERSION never appeared on the registry within ${limit}s." \
         "Nothing was tagged or released. Investigate, then re-dispatch."
    exit 1
  fi

  # npm records gitHead for every publish from a git checkout, and this
  # workflow only publishes from one. A missing gitHead means the version did
  # not come from here, so it is refused like a wrong one.
  local head integrity
  head="$(node -p 'require("./version.json").gitHead || ""')"
  integrity="$(node -p 'require("./version.json").dist?.integrity || ""')"
  rm -f version.json
  echo "registry gitHead: ${head:-<absent>}"
  if [ "$head" != "$GITHUB_SHA" ]; then
    echo "::error::the registry's $PACKAGE@$RELEASE_VERSION has gitHead '${head:-<absent>}'," \
         "not the release commit $GITHUB_SHA. Do not tag this. A wrong version can only be superseded."
    exit 1
  fi
  if [ -n "${EXPECTED_INTEGRITY:-}" ]; then
    echo "registry integrity: $integrity"
    if [ "$integrity" != "$EXPECTED_INTEGRITY" ]; then
      echo "::error::the registry's tarball integrity $integrity is not the verified pack's" \
           "$EXPECTED_INTEGRITY. Do not tag this."
      exit 1
    fi
  fi
  echo "$PACKAGE@$RELEASE_VERSION is live and matches $GITHUB_SHA."
}

tag() {
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git tag -a "$TAG" -m "$TAG — released by .github/workflows/release-foundation.yml" "$GITHUB_SHA"
  git push origin "refs/tags/$TAG"
}

release() {
  gh release create "$TAG" \
    --verify-tag \
    --title "$PACKAGE $RELEASE_VERSION" \
    --notes-file packages/foundation/CHANGELOG.md
}

case "${1:-}" in
  plan | readback | tag | release) "$1" ;;
  *)
    echo "usage: $0 plan|readback|tag|release" >&2
    exit 2
    ;;
esac
