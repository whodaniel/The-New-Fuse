#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';
const fs=require('node:fs');const path=require('node:path');const{execFileSync}=require('node:child_process');
const args=process.argv.slice(2),modeArg=args.find(a=>a.startsWith('--mode='))||'--mode=staged',mode=modeArg.split('=')[1]||'staged',baseArg=args.find(a=>a.startsWith('--base=')),baseRef=baseArg?baseArg.split('=')[1]:process.env.TNF_LOCKED_DOC_LEDGER_BASE_REF||'origin/main';
const repoRoot=process.cwd(),LEGACY_LEDGER_REL='docs/protocols/CHALLENGE_RATIONALE_LOG.md',EVENT_DIR_REL='docs/protocols/challenge-rationales';
const LEDGER_PROTECTED_FILES=['docs/protocols/DIRECTIVES.md','docs/protocols/TURN_ZERO_MANDATE.md','docs/protocols/TURN_END_MANDATE.md'];
function fail(m){console.error(`[locked-doc-ledger] BLOCKED (${mode}): ${m}`);process.exitCode=1;}function ok(m){console.log(`[locked-doc-ledger] OK (${mode}): ${m}`);}
function git(a){try{return execFileSync('git',a,{cwd:repoRoot,encoding:'utf8',stdio:['ignore','pipe','ignore']});}catch{return null;}}
const gitShow=(r,p)=>git(['show',`${r}:${p}`]),gitShowStaged=p=>git(['show',`:${p}`]);
function readWorkingTree(p){const a=path.join(repoRoot,p);return fs.existsSync(a)?fs.readFileSync(a,'utf8'):null;}function getCurrent(p){return mode==='staged'?gitShowStaged(p)||readWorkingTree(p):readWorkingTree(p);}function getBase(p){return mode==='staged'?gitShow('HEAD',p):gitShow(baseRef,p);}
function stripHeaderTags(t){if(t==null)return null;return t.split('\n').filter(l=>!/\[[A-Z_]+:[^\]]+\]/.test(l)).join('\n').trim();}
function changedEventFiles(){const d=mode==='staged'?['diff','--cached','--name-status','--',EVENT_DIR_REL]:['diff','--name-status',baseRef,'--',EVENT_DIR_REL];return (git(d)||'').trim().split('\n').filter(Boolean).map(l=>{const[s,...p]=l.split(/\s+/);return{status:s,relPath:p.pop()};}).filter(e=>e.relPath&&e.relPath.startsWith(`${EVENT_DIR_REL}/`)&&e.status.startsWith('A'));}
function freshChallengeTexts(){const out=[],cur=getCurrent(LEGACY_LEDGER_REL)||'',base=getBase(LEGACY_LEDGER_REL)||'';if(cur!==base)out.push({source:LEGACY_LEDGER_REL,text:cur});for(const e of changedEventFiles()){const t=getCurrent(e.relPath);if(t)out.push({source:e.relPath,text:t});}return out;}
function main(){if(mode==='ci'&&!git(['rev-parse','--verify',baseRef])){fail(`base ref "${baseRef}" unavailable — CI checkout needs fetch-depth:0 or --base=<ref>`);return;}const texts=freshChallengeTexts();let blocked=0;for(const p of LEDGER_PROTECTED_FILES){if(stripHeaderTags(getCurrent(p))===stripHeaderTags(getBase(p)))continue;const marker=`- file: ${p}`,source=texts.find(e=>e.text.includes(marker));if(source)ok(`${p} changed with rationale in ${source.source}`);else{fail(`${p} changed with no fresh rationale. Add an immutable event under ${EVENT_DIR_REL}/ containing "${marker}".`);blocked++;}}if(!blocked)ok(`${LEDGER_PROTECTED_FILES.length} protected file(s) checked; all changed bodies have fresh rationale events`);}
main();
