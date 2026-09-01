#!/usr/bin/env bash
# resolve-tnf-repo.test.sh — shell-side parity tests for resolve-tnf-repo.sh.
#
# Mirrors resolve-tnf-repo.test.cjs's cases so both language implementations
# of the canonical resolver contract (docs/protocols/DURABLE_LOCAL_RUNTIME_MANDATE.md)
# are exercised the same way. Run: bash scripts/tests/resolve-tnf-repo.test.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIVE="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/resolve-tnf-repo.sh"

PASS=0
FAIL=0

check() {
  local desc="$1" got="$2" want="$3"
  if [[ "$got" == "$want" ]]; then
    PASS=$((PASS + 1))
    echo "ok - $desc"
  else
    FAIL=$((FAIL + 1))
    echo "NOT OK - $desc (got: '$got' want: '$want')"
  fi
}

check_true() {
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then
    PASS=$((PASS + 1)); echo "ok - $desc"
  else
    FAIL=$((FAIL + 1)); echo "NOT OK - $desc (expected success)"
  fi
}

check_false() {
  local desc="$1"; shift
  if ! "$@" >/dev/null 2>&1; then
    PASS=$((PASS + 1)); echo "ok - $desc"
  else
    FAIL=$((FAIL + 1)); echo "NOT OK - $desc (expected failure)"
  fi
}

make_fake_checkout() {
  local origin="${1:-}"
  local dir
  dir="$(mktemp -d "${TMPDIR:-/tmp}/tnf-fake-checkout-XXXXXX")"
  mkdir -p "$dir/scripts/runtime"
  echo '// fake' > "$dir/scripts/runtime/tnf-status.cjs"
  git -C "$dir" init -q
  if [[ -n "$origin" ]]; then
    git -C "$dir" remote add origin "$origin"
  fi
  printf '%s\n' "$dir"
}

echo "=== resolve-tnf-repo.sh parity tests ==="

# 1. Resolves the live checkout via explicit path.
resolved="$(tnf_resolve_repo "$LIVE")"
check "resolves the live checkout via explicit path" "$resolved" "$LIVE"

# 2. Skips an invalid explicit path and still finds a live checkout (via cwd
#    ancestor walk, run from inside LIVE).
tmp_empty="$(mktemp -d "${TMPDIR:-/tmp}/tnf-empty-XXXXXX")"
resolved="$(cd "$LIVE/scripts" && tnf_resolve_repo "$tmp_empty")"
check "skips invalid explicit path, finds live checkout via cwd walk" "$resolved" "$LIVE"
rm -rf "$tmp_empty"

# 3. TNF_REPO_DIR override.
TNF_REPO_DIR="$LIVE" resolved="$(TNF_REPO_DIR="$LIVE" bash -c "source '$SCRIPT_DIR/../lib/resolve-tnf-repo.sh'; tnf_resolve_repo")"
check "TNF_REPO_DIR override resolves to LIVE" "$resolved" "$LIVE"

# 4. TNF_ROOT_DIR alias (the pre-existing ~70-script convention).
resolved="$(TNF_ROOT_DIR="$LIVE" bash -c "source '$SCRIPT_DIR/../lib/resolve-tnf-repo.sh'; tnf_resolve_repo")"
check "TNF_ROOT_DIR alias resolves to LIVE" "$resolved" "$LIVE"

# 5. Orphan/broken-worktree rejection (contract element b) — only run if the
#    known orphan is present on this machine; skip gracefully elsewhere.
if [[ -d "$HOME/Repos/tnf-monorepo" ]]; then
  check_false "orphaned worktree stub is rejected" tnf_has_authority "$HOME/Repos/tnf-monorepo"
else
  echo "skip - orphan-rejection case (no ~/Repos/tnf-monorepo on this machine)"
fi

# 6. Wrong-origin rejection (contract element c) — publication target.
fake="$(make_fake_checkout "https://github.com/whodaniel/The-New-Fuse.git")"
check_false "publication-target origin is rejected" tnf_has_authority "$fake"
rm -rf "$fake"

# 7. No origin remote at all is rejected.
fake="$(make_fake_checkout)"
check_false "missing origin remote is rejected" tnf_has_authority "$fake"
rm -rf "$fake"

# 8. Canonical origin via ssh form is accepted.
fake="$(make_fake_checkout "git@github.com:whodaniel/tnf-monorepo.git")"
check_true "canonical origin (ssh form) is accepted" tnf_has_authority "$fake"
rm -rf "$fake"

# 9. normalizeOriginSlug parity with the .cjs implementation.
check "normalize: https + .git" "$(tnf_normalize_origin_slug 'https://github.com/whodaniel/tnf-monorepo.git')" "whodaniel/tnf-monorepo"
check "normalize: ssh form" "$(tnf_normalize_origin_slug 'git@github.com:whodaniel/tnf-monorepo.git')" "whodaniel/tnf-monorepo"
check "normalize: trailing slash + case" "$(tnf_normalize_origin_slug 'https://github.com/WhoDaniel/TNF-Monorepo/')" "whodaniel/tnf-monorepo"

echo
echo "=== $PASS passed, $FAIL failed ==="
[[ "$FAIL" -eq 0 ]]
