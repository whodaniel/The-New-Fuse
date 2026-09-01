#!/usr/bin/env bash
# resolve-tnf-repo.sh — shell twin of resolve-tnf-repo.cjs.
#
# ==============================================================================
# CANONICAL RESOLVER CONTRACT (v2 — see docs/protocols/DURABLE_LOCAL_RUNTIME_MANDATE.md)
# ==============================================================================
# This is the shell implementation of the one canonical algorithm;
# resolve-tnf-repo.cjs is the Node twin and MUST implement the identical
# contract (parity enforced by resolve-tnf-repo.test.sh +
# resolve-tnf-repo.test.cjs).
#
# A candidate directory is authoritative ("has authority") only if it passes
# ALL of:
#   (a) marker file present — scripts/runtime/tnf-status.cjs
#   (b) live git work tree  — `git -C <dir> rev-parse --is-inside-work-tree`
#       succeeds. Rejects orphaned/broken worktrees (a linked worktree whose
#       main checkout was renamed/removed keeps its tracked files on disk but
#       can no longer be operated on with git at all — confirmed in
#       production: ~/Repos/tnf-monorepo). File existence alone does NOT
#       imply this; both checks are required.
#   (c) canonical remote identity — `git -C <dir> remote get-url origin`
#       normalizes to whodaniel/tnf-monorepo (case-insensitive, tolerating
#       .git suffix and https/ssh form). Per TURN_ZERO_MANDATE.md,
#       whodaniel/The-New-Fuse and whodaniel/fuse-control-plane are
#       downstream PUBLICATION targets, not the canonical dev repo — a
#       checkout whose origin is a publication target, or an unrelated repo,
#       is rejected here even if it happens to carry the marker file. This is
#       what prevents silent fallback to a repo-shaped-but-wrong checkout.
#
# Explicitly NOT part of the contract: directory basename. Nothing here
# pattern-matches on a path containing "tnf-monorepo" or "The-New-Fuse" — (b)
# and (c) are the only trust signals.
#
# Source this file, then call `tnf_resolve_repo [explicit_path]`. Prints the
# resolved path to stdout and returns 0, or prints nothing and returns 1.
#
# Resolution order (first hit wins, deterministic):
#   1. explicit argument (validated, not blindly trusted)
#   2. TNF_REPO_DIR / TNF_ROOT_DIR / TNF_REPO env vars, in that priority
#      (TNF_ROOT_DIR is the pre-existing convention used by ~70 other scripts
#      in this repo; recognized here for compatibility)
#   3. ~/.tnf/repo-root pointer file (written by install-tnf-host-wrappers)
#   4. well-known candidates (best-effort convenience only — not portable to
#      other users' machines; harmless to keep because every candidate is
#      still fully validated against (a)(b)(c) above)
#   5. walk up from $PWD looking for a directory satisfying (a)(b)(c)
#
# Rejection is deterministic: a candidate either fully satisfies (a)(b)(c) or
# it is skipped entirely — no partial credit, no "close enough" fallback.

TNF_REPO_POINTER_PATH="${TNF_REPO_POINTER_PATH:-$HOME/.tnf/repo-root}"
TNF_REPO_AUTHORITY_MARKER="${TNF_REPO_AUTHORITY_MARKER:-scripts/runtime/tnf-status.cjs}"
# The canonical development repository per TURN_ZERO_MANDATE.md.
TNF_CANONICAL_ORIGIN_SLUG="${TNF_CANONICAL_ORIGIN_SLUG:-whodaniel/tnf-monorepo}"

# tnf_normalize_origin_slug <url> — print "owner/repo", lowercased, stripped
# of .git suffix / protocol / trailing slashes. Tolerates https and ssh forms.
tnf_normalize_origin_slug() {
  local s="$1"
  s="${s%.git}"
  s="${s#git@*:}"
  s="${s#https://*/}"
  s="${s#http://*/}"
  s="${s%/}"
  printf '%s\n' "$s" | tr '[:upper:]' '[:lower:]'
}

# tnf_is_canonical_origin <dir> — contract element (c).
tnf_is_canonical_origin() {
  local dir="$1" url slug
  url="$(git -C "$dir" remote get-url origin 2>/dev/null)" || return 1
  [[ -n "$url" ]] || return 1
  slug="$(tnf_normalize_origin_slug "$url")"
  [[ "$slug" == "$TNF_CANONICAL_ORIGIN_SLUG" ]]
}

# tnf_has_authority <dir>
# True if <dir> has the marker file AND is a live, valid git work tree AND
# has the canonical remote identity. All three (a)(b)(c) are required.
tnf_has_authority() {
  local dir="$1"
  [[ -n "$dir" && -d "$dir" ]] || return 1
  [[ -f "$dir/$TNF_REPO_AUTHORITY_MARKER" ]] || return 1
  git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 1
  tnf_is_canonical_origin "$dir"
}

tnf_well_known_candidates() {
  printf '%s\n' \
    "$HOME/Repos/tnf-monorepo" \
    "$HOME/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse" \
    "$HOME/Desktop/A1-Inter-LLM-Com/The-New-Fuse" \
    "$HOME/.tnf-cli/fuse"
}

# tnf_resolve_repo [explicit_path]
tnf_resolve_repo() {
  local explicit="${1:-}"

  if [[ -n "$explicit" ]] && tnf_has_authority "$explicit"; then
    printf '%s\n' "$explicit"
    return 0
  fi

  if [[ -n "${TNF_REPO_DIR:-}" ]] && tnf_has_authority "$TNF_REPO_DIR"; then
    printf '%s\n' "$TNF_REPO_DIR"
    return 0
  fi
  if [[ -n "${TNF_ROOT_DIR:-}" ]] && tnf_has_authority "$TNF_ROOT_DIR"; then
    printf '%s\n' "$TNF_ROOT_DIR"
    return 0
  fi
  if [[ -n "${TNF_REPO:-}" ]] && tnf_has_authority "$TNF_REPO"; then
    printf '%s\n' "$TNF_REPO"
    return 0
  fi

  if [[ -f "$TNF_REPO_POINTER_PATH" ]]; then
    local pointer
    pointer="$(tr -d '[:space:]' < "$TNF_REPO_POINTER_PATH" 2>/dev/null || true)"
    if [[ -n "$pointer" ]] && tnf_has_authority "$pointer"; then
      printf '%s\n' "$pointer"
      return 0
    fi
  fi

  local candidate
  while IFS= read -r candidate; do
    if tnf_has_authority "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done < <(tnf_well_known_candidates)

  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if tnf_has_authority "$dir"; then
      printf '%s\n' "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done

  return 1
}

# tnf_write_repo_pointer <dir> — cache a resolved dir for next time.
tnf_write_repo_pointer() {
  local dir="$1"
  tnf_has_authority "$dir" || return 1
  mkdir -p "$(dirname "$TNF_REPO_POINTER_PATH")" 2>/dev/null || true
  printf '%s\n' "$dir" > "$TNF_REPO_POINTER_PATH"
}
