#!/usr/bin/env bash
set +e
set -u
export TNF_SKIP_TURN_ZERO_ONBOARD=1 CI=1 FORCE_COLOR=0
ROOT="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
OUT="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/.verifier/whole-codebase/rerun-c-2026-07-20T06-30-14Z"
export OUT RUN_ID="rerun-c-2026-07-20T06-30-14Z"
cd "$ROOT"
echo "continueC=$RUN_ID" | tee "$OUT/progress.log"
run_surface() {
  local name="$1"; shift
  local cmd="$*"
  local log="$OUT/logs/${name}.log"
  local meta="$OUT/surfaces/${name}.json"
  echo "START $name :: $cmd" | tee -a "$OUT/progress.log"
  local started=$(date +%s)
  bash -c "$cmd" >"$log" 2>&1
  local code=$?
  local ended=$(date +%s)
  local dur=$(( (ended-started)*1000 ))
  local ok=false; [[ $code -eq 0 ]] && ok=true
  node -e 'const fs=require("fs");const a=process.argv.slice(1);const [logPath,name,ok,code,dur,cmd,relLog,meta]=a;let tail="";try{tail=fs.readFileSync(logPath,"utf8").slice(-4000)}catch(e){tail=String(e)};fs.writeFileSync(meta,JSON.stringify({name,ok:ok==="true",exitCode:Number(code),durationMs:Number(dur),cmd,log:relLog,stdoutTail:tail},null,2));' "$log" "$name" "$ok" "$code" "$dur" "$cmd" "logs/${name}.log" "$meta"
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $([[ $ok == true ]] && echo PASS || echo FAIL) $name exit=$code ${dur}ms" | tee -a "$OUT/progress.log"
}
run_surface C02-turbo-lint "pnpm run lint"
run_surface C03-turbo-test-all "pnpm run test:all"
run_surface C04-turbo-build-packages "pnpm run build:packages"
run_surface C05-turbo-build-apps "pnpm run build:apps"
node <<'NODE'
const fs=require('fs');const path=require('path');
const OUT=process.env.OUT, RUN_ID=process.env.RUN_ID;
const surfaces=fs.readdirSync(path.join(OUT,'surfaces')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(OUT,'surfaces',f),'utf8')));
const passed=surfaces.filter(s=>s.ok).length, failed=surfaces.filter(s=>!s.ok).length;
const summary={runId:RUN_ID,timestamp:new Date().toISOString(),scope:'C_LAYER_CONTINUE',surfacesTotal:surfaces.length,passed,failed,ok:failed===0,score:`${passed}/${surfaces.length}`,
failedSurfaces:surfaces.filter(s=>!s.ok).map(s=>({name:s.name,exitCode:s.exitCode})),passedSurfaces:surfaces.filter(s=>s.ok).map(s=>s.name)};
fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(OUT,'SUMMARY.md'),`# C-layer continue

**Score:** ${summary.score}

## Failed
${summary.failedSurfaces.map(f=>`- ${f.name}`).join('
')||'_none_'}

## Passed
${summary.passedSurfaces.map(n=>`- ${n}`).join('
')}
`);
console.log(JSON.stringify({ok:summary.ok,score:summary.score},null,2));
NODE
