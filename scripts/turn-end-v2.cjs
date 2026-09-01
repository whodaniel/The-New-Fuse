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
  handoff.spec='tnf/session-handoff/0.2';
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
  handoff.freshness_receipts=freshnessReceipts(); return handoff;
}
function markdown(h){ return [
'# SESSION_HANDOFF_LATEST','',`Protocol ACK: \`${h.protocol_ack}\``,`Spec: \`${h.spec}\``,`Created At: \`${h.created_at}\``,`Handoff ID: \`${h.handoff_id}\``,'','## Repository','',`- Actual: \`${h.repository}\``,`- Canonical TNF source: \`${h.repository_context.canonical_source}\``,`- Origin: \`${h.repository_context.origin||'unknown'}\``,`- Branch: \`${h.branch}\``,`- Head SHA: \`${h.head_sha}\``,'','## Classification','',`- Work domain: \`${h.classification.work_domain}\``,`- Artifact destination: \`${h.classification.artifact_destination}\``,`- Data residency: \`${h.classification.data_residency}\``,`- Sensitivity: \`${h.classification.sensitivity}\``,'','## Capabilities','',`- Required: ${h.capabilities.required.join(', ')||'(not recorded)'}`,`- Staffed by: ${h.capabilities.staffed_by.join(', ')||'(not recorded)'}`,'','## Work Summary','',...(h.work_summary||[]).map(x=>`- ${x}`),'','## Next Actions','',...(h.next_actions||[]).map(x=>`- ${x}`),''].join('\n'); }
function main(){
  const args=process.argv.slice(2), noStage=args.includes('--no-stage'), legacyArgs=args.filter(x=>x!=='--no-stage'); legacyArgs.push('--no-stage');
  const legacy=spawnSync(process.execPath,[path.join(ROOT,'scripts/turn-end.cjs'),...legacyArgs],{cwd:ROOT,stdio:'inherit',env:process.env}); if(legacy.status!==0) process.exit(legacy.status||1);
  const h=upgrade(JSON.parse(fs.readFileSync(JSON_PATH,'utf8')));

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
}
if(require.main===module) main();
module.exports={upgrade,freshnessReceipts,normalizeOrigin};
