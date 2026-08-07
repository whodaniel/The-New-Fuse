#!/usr/bin/env bash
#
# Deploy apps/frontend to Cloudflare Pages, with provenance.
#
# Why this exists:
#   The Pages project `thenewfuse-main` is Direct Upload with no Git
#   integration (`wrangler pages project list` shows Git Provider = No), and
#   Cloudflare does not allow converting a Direct Upload project to Git. So
#   merging to main does NOT deploy. Deploys are manual uploads.
#
#   That makes the working tree the deploy artifact, which is dangerous: a
#   developer's tree can differ from main by dozens of files. This script
#   refuses to upload anything that did not come from a clean, known commit,
#   and records which commit produced the bundle.
#
# Usage:
#   scripts/deployment/deploy-frontend.sh                 # deploy current HEAD (must be clean)
#   scripts/deployment/deploy-frontend.sh --ref origin/main
#   scripts/deployment/deploy-frontend.sh --dry-run
#
set -euo pipefail

PROJECT="thenewfuse-main"
BRANCH="main"
REF=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref) REF="$2"; shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

# --- Guard: never deploy a dirty tree (unless deploying a detached --ref) ------
# The bundle must correspond to a commit someone can look up later.
# When --ref is set we build from a clean worktree of that ref, so the caller's
# dirty working tree is irrelevant.
if [[ -z "$REF" && -n "$(git status --porcelain -- apps/frontend packages)" ]]; then
  echo "ERROR: uncommitted changes in apps/frontend or packages." >&2
  echo "       The deployed bundle must correspond to a known commit." >&2
  echo "       Commit, stash, or deploy from a clean worktree." >&2
  exit 1
fi

if [[ -n "$REF" ]]; then
  echo "Checking out $REF into a temporary worktree..."
  WT="$(mktemp -d)/tnf-deploy"
  git worktree add --detach "$WT" "$REF"
  cd "$WT"
fi

SHA="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short HEAD)"
echo "Deploying commit $SHORT ($SHA)"

# --- Guard: the commit must be an ancestor of the deploy branch ---------------
# Blocks the "I deployed my feature branch to production" failure mode.
if ! git merge-base --is-ancestor "$SHA" "origin/$BRANCH" 2>/dev/null; then
  echo "ERROR: $SHORT is not an ancestor of origin/$BRANCH." >&2
  echo "       Refusing to deploy code that is not on the deploy branch." >&2
  exit 1
fi

# --- Record what production was serving, so we can assert it changed ----------
PREV_BUNDLE="$(curl -s -m 20 https://app.thenewfuse.com/ \
  | grep -oE '/assets/js/app\.[A-Za-z0-9_-]+\.js' | head -1 || true)"
echo "Currently live bundle: ${PREV_BUNDLE:-unknown}"

# --- Build -------------------------------------------------------------------
# turbo builds workspace dependencies first (build dependsOn ["^build"]);
# a clean checkout cannot resolve @the-new-fuse/* without this.
echo "Building (workspace deps first)..."
pnpm install --no-frozen-lockfile
pnpm turbo run build --filter=@the-new-fuse/frontend-app...

test -f apps/frontend/dist/app.html \
  || { echo "ERROR: build produced no dist/app.html" >&2; exit 1; }

# A Pages upload without functions silently falls through to marketing index.html
# for every SPA route (including /auth/login). Refuse to ship that failure mode.
test -f "apps/frontend/dist/functions/[[path]].js" \
  || { echo "ERROR: build produced no dist/functions/[[path]].js — refusing to deploy a shell-less app" >&2; exit 1; }
test -f "apps/frontend/functions/[[path]].js" \
  || { echo "ERROR: apps/frontend/functions/[[path]].js missing — wrangler will skip Functions" >&2; exit 1; }

if ! grep -q "X-TNF-Routing" "apps/frontend/dist/functions/[[path]].js"; then
  echo "ERROR: dist/functions/[[path]].js is missing SPA routing markers" >&2
  exit 1
fi

# Cloudflare Pages rejects files > 25 MiB; one oversized HTML has already aborted
# a deploy and left production on a Functions-less prior upload.
while IFS= read -r -d '' oversized; do
  echo "Removing oversize Pages asset (>24MiB): $oversized"
  rm -f "$oversized"
done < <(find apps/frontend/dist -type f -size +24M -print0 2>/dev/null || true)

if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY RUN: built successfully, not uploading."
  exit 0
fi

# --- Upload ------------------------------------------------------------------
# Wrangler resolves the Functions directory relative to cwd (apps/frontend),
# not relative to the upload directory. Deploying from repo root previously
# caused "No routes found .../functions - skipping" and left /auth/login on
# the marketing landing page.
echo "Uploading to Cloudflare Pages project '$PROJECT' (branch=$BRANCH)..."
(
  cd apps/frontend
  npx wrangler pages deploy dist \
    --project-name "$PROJECT" \
    --branch "$BRANCH" \
    --commit-hash "$SHA" \
    --commit-dirty=true
)

# --- Verify ------------------------------------------------------------------
# A deploy is not done because the upload command exited 0. It is done when the
# live site serves the new artifact and the app's contract holds.
echo "Waiting for propagation, then verifying..."
sleep 20
node scripts/deployment/verify-production.mjs \
  ${PREV_BUNDLE:+--expect-bundle-change "$PREV_BUNDLE"}
