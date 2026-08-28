#!/usr/bin/env bash
# tnf-launchd-guard.sh — resource preflight for launchd jobs.
#
# WHY
#   Audited 2026-08-27: every launchd job in ~/Library/LaunchAgents execs its
#   ProgramArguments directly with zero resource guard. com.thenewfuse.qa-swarm
#   was one of them — an unbounded continuous-build loop that drove load
#   average to 84-88 and free memory to ~15MB, crashing shells fleet-wide
#   ("[Process completed]" in every terminal). The cron path
#   (run-chronological-process.cjs) already had a preflight gate; launchd jobs
#   had nothing. This is that missing gate, generalized for any launchd job.
#
# USAGE (as a plist's ProgramArguments, wrapping whatever used to run there)
#   tnf-launchd-guard.sh --job <label> --class <build|daemon|watchdog|probe|default> \
#     [--repo-root <path>] -- <command> [args...]
#
# BEHAVIOR
#   - Runs `tnf-resource-guard.cjs preflight` (system load/memory snapshot +
#     class-level concurrency lock, e.g. only one `class:build` job fleet-wide).
#   - On deny: logs (the Node preflight call already appends to
#     ~/.tnf/alerts.json), sleeps a bounded backoff, exits 0 — so a KeepAlive
#     job backs off instead of hot-looping retries against an already
#     overloaded box. Pair with ThrottleInterval in the plist for
#     defense-in-depth.
#   - On allow: writes a small registration file (job label/class/root pid)
#     to ~/.tnf/resource-watchdog/registry/ so tnf-resource-watchdog.cjs can
#     attribute this job's whole descendant process tree without ever
#     reading process environments. (An earlier design tagged jobs via an
#     exported env var and had the watchdog read it back with `ps eww`. That
#     failed empirically: macOS restricts reading another process's
#     environment across the launchd bootstrap-namespace/session boundary,
#     so the watchdog could never see env vars on the exact class of
#     processes — launchd daemons — this exists to protect. `ps eww` also
#     dumps every OTHER env var too, including live secrets, which a
#     file-registry approach avoids touching at all.) Also exports
#     TNF_JOB_LABEL/TNF_JOB_CLASS as a harmless secondary signal for anyone
#     debugging by hand from an interactive shell, but nothing load-bearing
#     depends on it. Then applies `nice`/`taskpolicy -b` for background-class
#     jobs and execs the wrapped command unchanged — this wrapper does not
#     know or care what secrets/env-loading the wrapped command itself needs.
set -euo pipefail

REPO_ROOT_DEFAULT="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse"
PATH="/Users/danielgoldberg/.hermes/node/bin:/Users/danielgoldberg/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

job_label=""
job_class="default"
repo_root="$REPO_ROOT_DEFAULT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --job) job_label="$2"; shift 2 ;;
    --class) job_class="$2"; shift 2 ;;
    --repo-root) repo_root="$2"; shift 2 ;;
    --) shift; break ;;
    *) break ;;
  esac
done

if [[ -z "$job_label" || $# -eq 0 ]]; then
  echo "usage: tnf-launchd-guard.sh --job <label> [--class <class>] [--repo-root <path>] -- <command> [args...]" >&2
  exit 2
fi

log() {
  printf '[%s] [tnf-launchd-guard] [%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$job_label" "$*" >&2
}

guard_script="$repo_root/scripts/lib/tnf-resource-guard.cjs"
if [[ ! -f "$guard_script" ]]; then
  log "guard script missing at $guard_script — failing open (allow) so a repo move doesn't wedge every launchd job"
else
  node_bin="$(command -v node || true)"
  if [[ -z "$node_bin" ]]; then
    log "no node on PATH — failing open (allow)"
  else
    # $$ is this script's own shell PID. It survives the final `exec` below
    # (exec replaces the process image but keeps the PID), so the class lock's
    # registered owner PID stays correct for the wrapped job's entire runtime
    # — liveness-based staleness detection in tnf-single-instance-guard.cjs
    # then just works without this script needing an explicit release hook.
    if ! preflight_json="$("$node_bin" "$guard_script" preflight --job "$job_label" --class "$job_class" --pid "$$" --repo-root "$repo_root" 2>/dev/null)"; then
      reason="$(printf '%s' "$preflight_json" | node -e 'try{const d=JSON.parse(require("fs").readFileSync(0,"utf8"));process.stdout.write(d.reason||"unknown")}catch{process.stdout.write("unknown")}' 2>/dev/null || echo unknown)"
      backoff=$(( (RANDOM % 20) + 20 ))
      log "preflight denied (reason=$reason) — backing off ${backoff}s before exit so KeepAlive doesn't hot-loop"
      sleep "$backoff"
      exit 0
    fi
  fi
fi

export TNF_JOB_LABEL="$job_label"
export TNF_JOB_CLASS="$job_class"

# Primary attribution mechanism for the watchdog — see header comment for
# why this replaced env-var introspection. Best-effort: a registry write
# failure must never block the actual job from starting.
registry_dir="/Users/danielgoldberg/.tnf/resource-watchdog/registry"
mkdir -p "$registry_dir" 2>/dev/null || true
registry_file="$registry_dir/$(printf '%s' "$job_label" | tr -c 'A-Za-z0-9._-' '-').json"
printf '{"jobLabel":"%s","jobClass":"%s","rootPid":%d,"registeredAt":"%s"}\n' \
  "$job_label" "$job_class" "$$" "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$registry_file" 2>/dev/null || true

# Background-class jobs (build/watchdog/probe) get deprioritized so they never
# starve interactive terminal work even if they do end up running long.
case "$job_class" in
  build|watchdog|probe)
    if command -v taskpolicy >/dev/null 2>&1; then
      exec taskpolicy -b nice -n 10 "$@"
    else
      exec nice -n 10 "$@"
    fi
    ;;
  *)
    exec "$@"
    ;;
esac
