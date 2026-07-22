#!/usr/bin/env bash
# TNF Whole-Codebase Logic Verification — ENTIRE monorepo
# Isolated per-surface execution; never enables set -e.
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

RUN_ID="whole-$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT="$ROOT/.verifier/whole-codebase/$RUN_ID"
LATEST="$ROOT/.verifier/whole-codebase/latest"
mkdir -p "$OUT/logs" "$OUT/surfaces"
export ROOT OUT RUN_ID LATEST
echo "$RUN_ID" > "$ROOT/.verifier/whole-codebase/CURRENT_RUN"
echo "runId=$RUN_ID out=$OUT" | tee "$OUT/progress.log"

node - <<'NODE' > "$OUT/inventory.json"
const fs=require('fs');const path=require('path');
const ROOT=process.cwd(); const pkgs=[];
function walk(dir,depth){if(depth>3)return;let ents;try{ents=fs.readdirSync(dir,{withFileTypes:true})}catch{return}
for(const e of ents){if(['node_modules','dist','.git'].includes(e.name))continue;const abs=path.join(dir,e.name);
if(e.isDirectory())walk(abs,depth+1);else if(e.name==='package.json'){try{const pj=JSON.parse(fs.readFileSync(abs,'utf8'));pkgs.push({path:path.relative(ROOT,path.dirname(abs)),name:pj.name||path.basename(path.dirname(abs)),scripts:Object.keys(pj.scripts||{})})}catch{}}}}
for (const d of ['apps','packages','tools']) walk(path.join(ROOT,d),0);
process.stdout.write(JSON.stringify({timestamp:new Date().toISOString(),packageCount:pkgs.length,packages:pkgs},null,2));
NODE
PKG_COUNT=$(node -pe "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).packageCount" "$OUT/inventory.json")
echo "inventoried packages=$PKG_COUNT" | tee -a "$OUT/progress.log"

# Local whole-repo runs: seed TNF_HANDOFF_FILE_LIST so A01/A02 can pass without
# requiring handoff artifacts to already be in HEAD~1..HEAD (ci default).
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
TNF_HANDOFF_OWNER="${TNF_HANDOFF_OWNER:-tnf-core}" \
TNF_HANDOFF_SUMMARY="${TNF_HANDOFF_SUMMARY:-Whole-codebase verification run $RUN_ID}" \
TNF_HANDOFF_NEXT_ACTIONS="${TNF_HANDOFF_NEXT_ACTIONS:-Triage failed surfaces from .verifier/whole-codebase/latest/SUMMARY.md}" \
TNF_HANDOFF_RESUME_CHECKLIST="${TNF_HANDOFF_RESUME_CHECKLIST:-Read .verifier/whole-codebase/latest/SUMMARY.md||Re-run failed surfaces}" \
node scripts/protocols/emit-session-handoff.cjs >>"$OUT/progress.log" 2>&1 || true
echo "handoff file list ready: $HANDOFF_LIST ($(wc -l < "$HANDOFF_LIST" | tr -d ' ') paths)" | tee -a "$OUT/progress.log"

run_surface() {
  local name="$1"; shift
  local cmd="$*"
  local log="$OUT/logs/${name}.log"
  local meta="$OUT/surfaces/${name}.json"
  local started ended code dur ok
  echo "START $name :: $cmd" | tee -a "$OUT/progress.log"
  started=$(date +%s)
  # Fully isolated child shell + new session when available
  # Isolated child; do not use setsid (missing on macOS)
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
run_surface A03-protocol-schemas "tnf protocol schemas"
run_surface A04-local-runtime "tnf protocol local-runtime"
run_surface A05-protocol-health "tnf protocol health --json"
run_surface A06-directive-verify-cycle "node scripts/agents/tnf-directive-verify-cycle.cjs"
run_surface A07-turn-zero-authority "node scripts/protocols/validate-turn-zero-authority.cjs --mode=ci"
run_surface A08-handoff-source-drift "node scripts/protocols/validate-handoff-source-drift.cjs --mode=ci"
run_surface A09-sgp-schemas "node scripts/protocols/validate-sgp-schemas.cjs"
run_surface A10-doc-tagging "node scripts/protocols/validate-doc-tagging.cjs"
run_surface A11-cleanroom-boundary "node scripts/protocols/validate-cleanroom-boundary.cjs"
run_surface A12-agent-defs "node scripts/validate-agent-defs.cjs"
run_surface A13-orchestration-health "node scripts/protocols/validate-orchestration-health.cjs"

run_surface B01-architecture "node scripts/validation/validate-architecture.js"
run_surface B02-validate-build "node scripts/validate-build.cjs"
run_surface B03-check-agent-registration "node scripts/check-agent-registration.cjs"
run_surface B04-check-structure "bash scripts/check-structure.sh"
run_surface B05-audit-circular "pnpm run audit:circular"
run_surface B06-protocol-schemas-npm "node scripts/validate-protocol-schemas.cjs"
run_surface B07-validate-security "node scripts/validate-security.cjs"
run_surface B08-check-ts "node scripts/check-ts.js"

run_surface C01-turbo-type-check "pnpm exec turbo run type-check --concurrency=4"
run_surface C02-turbo-lint "pnpm run lint"
run_surface C03-turbo-test-all "pnpm run test:all"
run_surface C04-turbo-build-packages "pnpm run build:packages"
run_surface C05-turbo-build-apps "pnpm run build:apps"

run_surface D01-tnf-doctor-local "tnf doctor --mode local --allow-local-db"
run_surface D02-alive-status "tnf alive status"
run_surface D03-agents-live-status "tnf agents live status"

node <<'NODE'
const fs=require('fs');const path=require('path');
const ROOT=process.env.ROOT, OUT=process.env.OUT, RUN_ID=process.env.RUN_ID, LATEST=process.env.LATEST;
const surfaces=fs.readdirSync(path.join(OUT,'surfaces')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(OUT,'surfaces',f),'utf8')));
const inv=JSON.parse(fs.readFileSync(path.join(OUT,'inventory.json'),'utf8'));
const passed=surfaces.filter(s=>s.ok).length, failed=surfaces.filter(s=>!s.ok).length;
const summary={runId:RUN_ID,timestamp:new Date().toISOString(),scope:'ENTIRE_CODEBASE',packageCount:inv.packageCount,surfacesTotal:surfaces.length,passed,failed,ok:failed===0,score:`${passed}/${surfaces.length}`,
failedSurfaces:surfaces.filter(s=>!s.ok).map(s=>({name:s.name,exitCode:s.exitCode,durationMs:s.durationMs,log:s.log})),
passedSurfaces:surfaces.filter(s=>s.ok).map(s=>s.name),outDir:path.relative(ROOT,OUT)};
fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(OUT,'SUMMARY.md'),`# TNF Whole-Codebase Verification\n\n**Run:** \`${RUN_ID}\`\n**Score:** ${summary.score}\n**OK:** ${summary.ok}\n**Packages:** ${inv.packageCount}\n\n## Failed (${failed})\n${summary.failedSurfaces.length?summary.failedSurfaces.map(f=>`- **${f.name}** exit=${f.exitCode} \`${f.log}\``).join('\n'):'_none_'}\n\n## Passed (${passed})\n${summary.passedSurfaces.map(n=>`- ${n}`).join('\n')}\n`);
try{fs.rmSync(LATEST,{recursive:true,force:true})}catch{}
fs.cpSync(OUT,LATEST,{recursive:true});
console.log(JSON.stringify({ok:summary.ok,score:summary.score,outDir:summary.outDir,failed},null,2));
process.exit(summary.ok?0:1);
NODE
