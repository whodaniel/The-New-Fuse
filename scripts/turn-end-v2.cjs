#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = process.env.TNF_ROOT_DIR || process.cwd();
const JSON_PATH = path.join(ROOT, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json');
const MD_PATH = path.join(ROOT, 'docs/protocols/reports/SESSION_HANDOFF_LATEST.md');
const FRESHNESS_PATH = path.join(ROOT, 'data/protocols/state-freshness.json');
const CANONICAL_SOURCE = 'whodaniel/tnf-monorepo';

function git(args) { try { return execFileSync('git', args, { cwd: ROOT, encoding:'utf8', stdio:['ignore','pipe','ignore'] }).trim(); } catch { return ''; } }
function normalizeOrigin(input) {
  const raw = String(input || '').trim().replace(/\.git$/, '');
  const ssh = raw.match(/^git@github\.com:(.+)$/); if (ssh) return ssh[1];
  const https = raw.match(/^https?:\/\/github\.com\/(.+)$/); if (https) return https[1];
  return raw || 'unknown';
}
function csv(name) { return String(process.env[name] || '').split(',').map((x)=>x.trim()).filter(Boolean); }
function truthy(name) { return /^(1|true|yes)$/i.test(String(process.env[name] || '')); }
function env(name, fallback='unknown') { return String(process.env[name] || fallback).trim().toLowerCase(); }
function freshnessReceipts() {
  try {
    const data = JSON.parse(fs.readFileSync(FRESHNESS_PATH,'utf8'));
    return Object.entries(data.receipts || {}).map(([id,r]) => {
      const age = r.observedAt ? Math.max(0, Math.floor((Date.now()-Date.parse(r.observedAt))/1000)) : Infinity;
      let state='FRESH'; if (r.split) state='SPLIT'; else if (!r.ok) state='PROBE_FAILED'; else if (age>Number(r.ttlSeconds||0)) state='STALE';
      return { id, state, observed_at:r.observedAt||'', value:String(r.value||'').slice(0,500) };
    });
  } catch { return []; }
}
function operationInProgress() {
  const gitDir=git(['rev-parse','--git-dir']); if(!gitDir) return null; const abs=path.resolve(ROOT,gitDir);
  for(const [name,marker] of [['merge','MERGE_HEAD'],['cherry-pick','CHERRY_PICK_HEAD'],['revert','REVERT_HEAD'],['rebase','rebase-merge'],['rebase','rebase-apply']]) if(fs.existsSync(path.join(abs,marker))) return name;
  return null;
}
function upgrade(handoff) {
  const origin = git(['remote','get-url','origin']);
  const actualRepository = normalizeOrigin(origin);
  handoff.spec='tnf/session-handoff/0.3';
  handoff.repository=actualRepository;
  handoff.repository_context={
    canonical_source:CANONICAL_SOURCE,
    actual:actualRepository,
    origin,
    dirty:Boolean(git(['status','--porcelain'])),
    operation_in_progress:operationInProgress(),
    publication_targets:['whodaniel/The-New-Fuse','whodaniel/fuse-control-plane']
  };
  handoff.classification={ work_domain:env('TNF_WORK_DOMAIN'), artifact_destination:env('TNF_ARTIFACT_DESTINATION'), data_residency:env('TNF_DATA_RESIDENCY'), sensitivity:env('TNF_DATA_SENSITIVITY') };
  handoff.sensitive_scope=handoff.classification.sensitivity==='unknown' ? (handoff.sensitive_scope||'internal') : handoff.classification.sensitivity;
  handoff.capabilities={ required:csv('TNF_REQUIRED_CAPABILITIES'), staffed_by:csv('TNF_STAFFED_BY') };
  handoff.publication={ public_runtime_affected:truthy('TNF_PUBLIC_RUNTIME_AFFECTED'), control_plane_affected:truthy('TNF_CONTROL_PLANE_AFFECTED'), satellites:csv('TNF_SATELLITES_AFFECTED') };
  handoff.freshness_receipts=freshnessReceipts();
  // TNF-0108 registry identity fields: individually addressable handoffs.
  // Absent when the harness does not provide them (optional in schema 0.3).
  const sessionId=String(process.env.TNF_SESSION_ID||'').trim(); if(sessionId) handoff.session_id=sessionId;
  const sessionHarness=String(process.env.TNF_SESSION_HARNESS||'').trim(); if(sessionHarness) handoff.session_harness=sessionHarness;
  const checkoutId=String(process.env.TNF_CHECKOUT_ID||'').trim(); if(checkoutId) handoff.checkout_id=checkoutId;
  const taskId=String(process.env.TNF_TASK_ID||'').trim(); if(taskId) handoff.task_id=taskId;
  return handoff;
}
function markdown(h){ return [
'# SESSION_HANDOFF_LATEST','',`Protocol ACK: \`${h.protocol_ack}\``,`Spec: \`${h.spec}\``,`Created At: \`${h.created_at}\``,`Handoff ID: \`${h.handoff_id}\``,'','## Repository','',`- Actual: \`${h.repository}\``,`- Canonical TNF source: \`${h.repository_context.canonical_source}\``,`- Origin: \`${h.repository_context.origin||'unknown'}\``,`- Branch: \`${h.branch}\``,`- Head SHA: \`${h.head_sha}\``,'','## Classification','',`- Work domain: \`${h.classification.work_domain}\``,`- Artifact destination: \`${h.classification.artifact_destination}\``,`- Data residency: \`${h.classification.data_residency}\``,`- Sensitivity: \`${h.classification.sensitivity}\``,'','## Capabilities','',`- Required: ${h.capabilities.required.join(', ')||'(not recorded)'}`,`- Staffed by: ${h.capabilities.staffed_by.join(', ')||'(not recorded)'}`,'','## Work Summary','',...(h.work_summary||[]).map(x=>`- ${x}`),'','## Next Actions','',...(h.next_actions||[]).map(x=>`- ${x}`),''].join('\n'); }
/** Repeatable `--flag value` collector. */
function collectFlag(args, flag){
  const out=[];
  for(let i=0;i<args.length;i++) if(args[i]===flag && args[i+1]!==undefined) out.push(args[i+1]);
  return out;
}
function singleFlag(args, flag){
  const i=args.indexOf(flag);
  return i!==-1 && args[i+1]!==undefined ? args[i+1] : null;
}

/**
 * Build handoff.reflection from what the author actually asserted.
 *
 * Never infers an answer. turn-end-reflection.cjs is explicit that an automated
 * "no lessons today" is the fabricated pass TURN_END_MANDATE forbids, so absent
 * flags mean considered:false and the self-audit says so.
 */
function buildReflection(args){
  const lessons=collectFlag(args,'--lesson');
  const skills=collectFlag(args,'--skill');
  const gaps=collectFlag(args,'--gap');
  const noLessons=singleFlag(args,'--no-lessons');
  const noSkills=singleFlag(args,'--no-skills');
  const noGaps=singleFlag(args,'--no-gaps');

  const reflection={
    lessons:{considered:Boolean(lessons.length||noLessons)},
    skills:{considered:Boolean(skills.length||noSkills)},
  };
  if(lessons.length) reflection.lessons.recorded=lessons;
  if(noLessons) reflection.lessons.rationale=noLessons;
  if(skills.length) reflection.skills.proposed=skills;
  if(noSkills) reflection.skills.rationale=noSkills;
  if(skills.length) reflection.skills.overlap_reviewed=true;

  reflection.gaps={considered:Boolean(gaps.length||noGaps)};
  if(gaps.length) reflection.gaps.open=gaps.map(g=>({summary:g}));
  if(noGaps) reflection.gaps.rationale=noGaps;
  return reflection;
}

/** The handoff this turn is replacing, for staleness comparison. */
function previousHandoff(){
  try{
    const prev=execFileSync('git',['show','HEAD:docs/protocols/reports/SESSION_HANDOFF_LATEST.json'],
      {cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore']});
    return JSON.parse(prev);
  }catch{ return null; }
}

function dirtyPathCount(){
  try{
    const out=execFileSync('git',['status','--porcelain'],{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore']});
    return out.split('\n').filter(Boolean).length;
  }catch{ return null; }
}

function printUsage(){
  console.log([
    'Usage: node scripts/turn-end-v2.cjs [options]',
    '',
    'Emits the canonical session handoff (spec tnf/session-handoff/0.3) and',
    'appends to docs/protocols/AGENT_STATUS_LEDGER.md.',
    '',
    'Options:',
    '  -h, --help           Show this help and exit without emitting a handoff',
    '  --summary <text>     Work summary, comma-separated items',
    '  --no-stage           Do not `git add` the handoff/ledger files',
    '  --scoped             Publish a session receipt without changing checkout files',
    '',
    'Reflection (Axiom 5/8 — an improvement that never reaches the framework is void):',
    '  --lesson <slug>      Record a lesson this session produced (repeatable)',
    '  --skill <slug>       Record a reusable skill this session actualized (repeatable)',
    '  --gap "<text>"       Record a gap left open, for the next session (repeatable)',
    '  --no-lessons "<why>" Assert there was nothing to learn, with a reason',
    '  --no-skills "<why>"  Assert no reusable capability, with a reason',
    '  --no-gaps "<why>"    Assert no open gaps, with a reason',
    '',
    'Reflection is never auto-answered: with none of the above the handoff records',
    'considered:false and the self-audit reports it. A fabricated "nothing today" is',
    'worse than an honest blank.',
    '',
    'Classification (read from the environment, recorded in the handoff):',
    '  TNF_WORK_DOMAIN  TNF_ARTIFACT_DESTINATION  TNF_DATA_RESIDENCY  TNF_DATA_SENSITIVITY',
    '',
    'An existing continuation directive is preserved; set TNF_HANDOFF_SET_DIRECTIVE=1',
    'to replace it.',
  ].join('\n'));
}

function reviewHandoff(jsonPath, capture = false) {
  if (process.env.TNF_AGENT_ROLE === 'critic' || process.env.TNF_CRITIC_DISABLED === '1')
    return { status: 'disabled' };
  const source = path.join(ROOT, 'packages/tnf-cli/src/critic-entry.ts');
  const built = path.join(ROOT, 'packages/tnf-cli/dist/critic-entry.js');
  let criticArgs;
  try {
    if (fs.existsSync(source)) criticArgs = ['--import', require.resolve('tsx'), source];
    else if (fs.existsSync(built)) criticArgs = [built];
  } catch {
    if (fs.existsSync(built)) criticArgs = [built];
  }
  if (!criticArgs) return { status: 'unavailable', reason: 'TNF critic runtime missing' };
  const result = spawnSync(process.execPath,
    [...criticArgs, 'critic', 'review', '--handoff', jsonPath, ...(capture ? ['--json'] : [])], {
      cwd: ROOT, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit',
      env: process.env, timeout: 130000,
    });
  if (capture && result.status === 0) {
    try {
      const receipt = JSON.parse(result.stdout);
      const handoff = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (!['reviewed', 'failed', 'disabled', 'skipped'].includes(receipt.status)
        || receipt.turnId !== handoff.handoff_id) throw new Error('Uncorrelated critic receipt');
      return { status: receipt.status, exitCode: 0, receipt,
        detail: (receipt.critique || receipt.error || '').slice(0, 12000) };
    } catch (error) { return { status: 'failed', exitCode: 0, detail: `Invalid critic output: ${error.message}` }; }
  }
  return { status: result.status === 0 ? 'completed' : 'failed', exitCode: result.status,
    detail: capture ? `${result.stdout || ''}\n${result.stderr || ''}`.trim().slice(-6000) : undefined };
}

function scopedTurnEnd(args) {
  const sessionId = process.env.TNF_SESSION_ID || process.env.CODEX_THREAD_ID;
  if (!sessionId) throw new Error('--scoped requires TNF_SESSION_ID or CODEX_THREAD_ID');
  const registry = require(path.join(ROOT, 'scripts/harness/handoff-registry.cjs'));
  const handoff = upgrade({
    handoff_id: require('node:crypto').randomUUID(), created_at: new Date().toISOString(),
    branch: git(['branch', '--show-current']), head_sha: git(['rev-parse', 'HEAD']),
    protocol_ack: 'TNF_PROTOCOL_ACK', session_id: sessionId,
    work_summary: [singleFlag(args, '--summary') || 'Completed external agent turn'],
    changed_paths: csv('TNF_HANDOFF_CHANGED_PATHS'),
    verification: { privacy_guard: 'na', secret_sweep: 'na', docs_pii_guard: 'na',
      supabase_rls_audit: 'na', notes: 'Lifecycle receipt only; no code validation asserted.' },
    continuation: { owner: sessionId, targets: [sessionId], priority: 'medium',
      resume_checklist: ['Run TNF Turn Zero before continuing the operator task.'] },
    next_actions: ['Continue only work authorized by the operator.'],
    reflection: buildReflection(args),
  });
  const published = registry.publish({ repoRoot: ROOT, handoff, opts: {
    sessionId, taskId: process.env.TNF_TASK_ID, mirror: false, noSupersede: true,
  } });
  const readBack = JSON.parse(fs.readFileSync(published.recordPath, 'utf8'));
  if (readBack.handoff_id !== handoff.handoff_id || readBack.record_hash !== published.row.record_hash
    || registry.hashBody(readBack) !== readBack.record_hash)
    throw new Error('Scoped handoff read-back mismatch');
  const critic = reviewHandoff(published.recordPath, true);
  const result = { ok: true, handoffId: handoff.handoff_id, recordPath: published.recordPath,
    recordHash: readBack.record_hash, sessionId, critic, storage: 'host-local-registry' };
  console.log(JSON.stringify(result));
  return result;
}

function main(){
  const args=process.argv.slice(2);
  // Handle --help here rather than delegating it. The legacy script prints its
  // own usage and exits 0, but this wrapper used to carry on afterwards and
  // emit a real handoff — so `--help` rewrote SESSION_HANDOFF_LATEST.{json,md},
  // appended to the status ledger, and (without --no-stage) staged all three.
  // A help flag must not mutate protocol state.
  if(args.includes('-h')||args.includes('--help')){ printUsage(); return; }
  if(args.includes('--scoped')) { scopedTurnEnd(args); return; }
  const noStage=args.includes('--no-stage'), legacyArgs=args.filter(x=>x!=='--no-stage'); legacyArgs.push('--no-stage');
  const legacy=spawnSync(process.execPath,[path.join(ROOT,'scripts/turn-end.cjs'),...legacyArgs],{cwd:ROOT,stdio:'inherit',env:process.env}); if(legacy.status!==0) process.exit(legacy.status||1);
  const h=upgrade(JSON.parse(fs.readFileSync(JSON_PATH,'utf8')));

  // Ask the two reflection questions every turn. Until now nothing invoked
  // turn-end-reflection.cjs, so `reflection` was null in every handoff — the
  // questions were not answered "none", they were never asked.
  console.log('');
  spawnSync(process.execPath,[path.join(ROOT,'scripts/protocols/turn-end-reflection.cjs')],
    {cwd:ROOT,stdio:'inherit',env:process.env});

  h.reflection=buildReflection(args);

  // Gap analysis of this Turn End run, recorded whether or not it is acted on.
  const { selfAudit } = require(path.join(ROOT,'scripts/protocols/turn-end-reflection.cjs'));
  h.reflection.self_audit=selfAudit({
    handoff:h,
    previous:previousHandoff(),
    dirtyPaths:dirtyPathCount(),
  });

  const failed=h.reflection.self_audit.checks.filter(c=>!c.ok);
  console.log('=== Turn End Self-Audit ===');
  for(const c of h.reflection.self_audit.checks){
    console.log(`  ${c.ok?'OK  ':'GAP '} ${c.id}: ${c.detail}`);
  }
  if(failed.length){
    console.log(`  ${failed.length} finding(s) — recorded in handoff.reflection.self_audit, not blocking`);
  }
  console.log('');

  // Update AGENT_STATUS_LEDGER.md automatically
  try {
    const ledgerPath = path.join(ROOT, 'docs/protocols/AGENT_STATUS_LEDGER.md');
    if (fs.existsSync(ledgerPath)) {
      let ledger = fs.readFileSync(ledgerPath, 'utf8');
      const lines = ledger.split('\n');
      const insertIdx = lines.findIndex(l => l.startsWith('# Agent Status Ledger')) + 2;
      if (insertIdx >= 2) {
        const timestamp = new Date().toISOString() + 'Z';
        const summaryText = (h.work_summary && h.work_summary[0]) ? h.work_summary[0] : 'Turn End Automated Handoff';
        const entry = `- **Updated: ${timestamp}** — ${summaryText}\n`;
        lines.splice(insertIdx, 0, entry);
        fs.writeFileSync(ledgerPath, lines.join('\n'));
        if (!noStage) {
          spawnSync('git', ['add', 'docs/protocols/AGENT_STATUS_LEDGER.md'], {cwd: ROOT});
        }
      }
    }
  } catch (e) {
    console.error('Failed to update ledger automatically:', e.message);
  }
 fs.writeFileSync(JSON_PATH,`${JSON.stringify(h,null,2)}\n`); fs.writeFileSync(MD_PATH,markdown(h));
  if(!noStage) spawnSync('git',['add','docs/protocols/reports/SESSION_HANDOFF_LATEST.json','docs/protocols/reports/SESSION_HANDOFF_LATEST.md'],{cwd:ROOT,stdio:'inherit'});
  console.log(`Turn End V2 complete: ${h.handoff_id}`);
  // External agents receive prompt-mode criticism in this tool result. Other
  // destinations are handled by the same service as native TNF agent turns.
  const critic = reviewHandoff(JSON_PATH);
  if (['failed', 'unavailable'].includes(critic.status))
    console.error('[tnf critic] Turn-end review unavailable; handoff preserved');
}
if(require.main===module) main();
module.exports={upgrade,freshnessReceipts,normalizeOrigin};
