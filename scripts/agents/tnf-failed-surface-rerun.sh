#!/usr/bin/env bash

# --- tnf dependency preflight ------------------------------------------
# cron's minimal PATH omits where this machine keeps its tooling. With no
# 'set -e', a missing binary yields 'command not found', exit 0, and a
# cycle cron records as successful while doing nothing. Fail loudly.
for _tnf_bin in node pnpm; do
  command -v "$_tnf_bin" >/dev/null 2>&1 || {
    echo "FATAL: required binary '$_tnf_bin' not found. PATH=$PATH" >&2
    exit 127
  }
done
# --- end tnf dependency preflight -----------------------------------

# Re-run previously failed whole-codebase surfaces after remediation.
set +e
set -u

# --- Fleet-wide pause gate (2026-07-21) ---
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

export TNF_SKIP_TURN_ZERO_ONBOARD=1
export CI="${CI:-1}"
export FORCE_COLOR=0
export TNF_WHOLE_CODEBASE_VERIFY=1
export TNF_SECURITY_LOCAL="${TNF_SECURITY_LOCAL:-1}"

ROOT="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
cd "$ROOT" || exit 1

RUN_ID="rerun-$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT="$ROOT/.verifier/whole-codebase/$RUN_ID"
mkdir -p "$OUT/logs" "$OUT/surfaces"
echo "$RUN_ID" > "$ROOT/.verifier/whole-codebase/CURRENT_RERUN"
export ROOT OUT RUN_ID
echo "rerunId=$RUN_ID out=$OUT" | tee "$OUT/progress.log"

HANDOFF_LIST="$OUT/handoff-file-list.txt"
{
  git diff --name-only --diff-filter=ACMR HEAD~1..HEAD 2>/dev/null || true
  git status --porcelain 2>/dev/null | awk '{print $NF}' || true
  printf '%s\n' \
    'docs/protocols/reports/SESSION_HANDOFF_LATEST.json' \
    'docs/protocols/reports/SESSION_HANDOFF_LATEST.md' \
    'docs/protocols/AGENT_STATUS_LEDGER.md'
} | sed '/^$/d' | sort -u > "$HANDOFF_LIST"
export TNF_HANDOFF_FILE_LIST="$HANDOFF_LIST"

TNF_HANDOFF_OWNER=tnf-core \
TNF_HANDOFF_SUMMARY="Failed-surface rerun $RUN_ID" \
TNF_HANDOFF_NEXT_ACTIONS="Triage remaining failures in .verifier/whole-codebase/latest-rerun/SUMMARY.md" \
node scripts/protocols/emit-session-handoff.cjs >>"$OUT/progress.log" 2>&1 || true

run_surface() {
  local name="$1"; shift
  local cmd="$*"
  local log="$OUT/logs/${name}.log"
  local meta="$OUT/surfaces/${name}.json"
  echo "START $name :: $cmd" | tee -a "$OUT/progress.log"
  local started ended code dur ok
  started=$(date +%s)
  bash -c "$cmd" >"$log" 2>&1
  code=$?
  ended=$(date +%s)
  dur=$(( (ended-started)*1000 ))
  if [[ $code -eq 0 ]]; then ok=true; else ok=false; fi
  node -e '
    const fs=require("fs");
    const [logPath,name,ok,code,dur,cmd,relLog,meta]=process.argv.slice(1);
    let tail=""; try{tail=fs.readFileSync(logPath,"utf8").slice(-4000)}catch(e){tail=String(e)}
    fs.writeFileSync(meta, JSON.stringify({name,ok:ok==="true",exitCode:Number(code),durationMs:Number(dur),cmd,log:relLog,stdoutTail:tail},null,2));
  ' "$log" "$name" "$ok" "$code" "$dur" "$cmd" "logs/${name}.log" "$meta"
  if [[ $ok == true ]]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) PASS $name exit=$code ${dur}ms" | tee -a "$OUT/progress.log"
  else
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) FAIL $name exit=$code ${dur}ms" | tee -a "$OUT/progress.log"
  fi
}

run_surface A01-protocol-validate "tnf protocol validate"
run_surface A02-protocol-gate "tnf protocol gate"
run_surface A10-doc-tagging "node scripts/protocols/validate-doc-tagging.cjs"
run_surface B02-validate-build "node scripts/validate-build.cjs"
run_surface B03-check-agent-registration "node scripts/check-agent-registration.cjs"
run_surface B07-validate-security "node scripts/validate-security.cjs"
run_surface C01-turbo-type-check "pnpm exec turbo run type-check --concurrency=2"
run_surface C02-turbo-lint "pnpm run lint"
run_surface C03-turbo-test-all "pnpm run test:all"
run_surface C04-turbo-build-packages "pnpm run build:packages"
run_surface C05-turbo-build-apps "pnpm run build:apps"

node <<'NODE'
const fs=require('fs');const path=require('path');
const OUT=process.env.OUT, RUN_ID=process.env.RUN_ID;
const surfaces=fs.readdirSync(path.join(OUT,'surfaces')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(OUT,'surfaces',f),'utf8')));
const passed=surfaces.filter(s=>s.ok).length, failed=surfaces.filter(s=>!s.ok).length;
const summary={runId:RUN_ID,timestamp:new Date().toISOString(),scope:'FAILED_SURFACE_RERUN',surfacesTotal:surfaces.length,passed,failed,ok:failed===0,score:`${passed}/${surfaces.length}`,
failedSurfaces:surfaces.filter(s=>!s.ok).map(s=>({name:s.name,exitCode:s.exitCode,durationMs:s.durationMs,log:s.log})),
passedSurfaces:surfaces.filter(s=>s.ok).map(s=>s.name)};
fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(OUT,'SUMMARY.md'),`# Failed-Surface Rerun\n\n**Run:** \`${RUN_ID}\`\n**Score:** ${summary.score}\n\n## Failed (${failed})\n${summary.failedSurfaces.length?summary.failedSurfaces.map(f=>`- **${f.name}** exit=${f.exitCode}`).join('\n'):'_none_'}\n\n## Passed (${passed})\n${summary.passedSurfaces.map(n=>`- ${n}`).join('\n')}\n`);
const latestRerun=path.join(path.dirname(OUT),'latest-rerun');
try{fs.rmSync(latestRerun,{recursive:true,force:true})}catch{}
fs.cpSync(OUT,latestRerun,{recursive:true});
console.log(JSON.stringify({ok:summary.ok,score:summary.score,outDir:path.relative(process.cwd(),OUT)},null,2));
process.exit(summary.ok?0:1);
NODE
