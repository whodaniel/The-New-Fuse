#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { hydrateStage } = require('./frontload-manifest.cjs');
const { validateHandoff } = require('./validate-session-handoff.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const CANONICAL = 'whodaniel/tnf-monorepo';
const PUBLICATION_TARGETS = new Set(['whodaniel/the-new-fuse', 'whodaniel/fuse-control-plane']);
const PRODUCT_MAP = 'data/distribution/product-repo-map.json';
const OSS_BOUNDARY = 'data/distribution/oss-app-boundary.json';
const PRODUCT_BOUNDARY = 'docs/product/TNF_PRODUCT_BOUNDARY.md';
const REPO_SEPARATION = 'docs/REPO_SEPARATION.md';
const ONBOARDING_CONTRACT = 'data/harness/onboarding-contract.json';
const HANDOFF = 'docs/protocols/reports/SESSION_HANDOFF_LATEST.json';
const LIVING_STATE = 'docs/protocols/LIVING_STATE.md';
const RUNTIME_RECEIPT = '.agent/runtime-logs/turn-zero-stage-a.latest.json';

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function normalizeOrigin(input) {
  const raw = String(input || '').trim().replace(/\.git$/, '');
  const ssh = raw.match(/^git@github\.com:(.+)$/);
  if (ssh) return ssh[1];
  const https = raw.match(/^https?:\/\/github\.com\/(.+)$/);
  if (https) return https[1];
  const api = raw.match(/^https?:\/\/api\.github\.com\/repos\/(.+)$/);
  if (api) return api[1];
  return raw;
}

function repositoryMode(normalizedOrigin) {
  const key = String(normalizedOrigin || '').toLowerCase();
  if (key === CANONICAL.toLowerCase()) return 'canonical-development';
  if (PUBLICATION_TARGETS.has(key)) return 'downstream-publication-target';
  if (key) return 'external-or-fork';
  return 'unknown';
}

function inProgressOperation() {
  const gitDir = git(['rev-parse', '--git-dir']);
  if (!gitDir) return null;
  const abs = path.resolve(ROOT, gitDir);
  for (const [name, rel] of [['merge','MERGE_HEAD'],['cherry-pick','CHERRY_PICK_HEAD'],['revert','REVERT_HEAD'],['rebase','rebase-merge'],['rebase','rebase-apply']]) {
    if (fs.existsSync(path.join(abs, rel))) return name;
  }
  return null;
}

function repoReceipt() {
  const origin = git(['remote', 'get-url', 'origin']);
  const normalizedOrigin = normalizeOrigin(origin);
  const dirtyLines = git(['status', '--porcelain']);
  const mode = repositoryMode(normalizedOrigin);
  return {
    root: git(['rev-parse', '--show-toplevel']),
    origin,
    normalizedOrigin,
    mode,
    canonical: mode === 'canonical-development',
    publicationTarget: mode === 'downstream-publication-target',
    branch: git(['branch', '--show-current']) || 'detached',
    head: git(['rev-parse', 'HEAD']),
    dirty: Boolean(dirtyLines),
    operationInProgress: inProgressOperation(),
  };
}

const VALID = {
  domain: new Set(['core', 'agency', 'personal', 'unknown']),
  destination: new Set(['oss_runtime', 'public_contract', 'private_control_plane', 'satellite', 'external', 'unknown']),
  residency: new Set(['product_state', 'bounded_working', 'external_durable', 'secret_machine_local', 'unknown']),
  sensitivity: new Set(['public', 'internal', 'private', 'restricted', 'unknown']),
};
// TURN_ZERO_MANDATE.md: "Classification is recorded in handoff state." The
// handoff is the record; the TNF_* environment variables are explicitly
// "environment hints" (same doc). Read the record first and let a hint override
// it, recording which source won so the receipt stays auditable (D5, Gate 4).
const CLASSIFICATION_AXES = [
  ['workDomain', 'work_domain', 'TNF_WORK_DOMAIN'],
  ['artifactDestination', 'artifact_destination', 'TNF_ARTIFACT_DESTINATION'],
  ['dataResidency', 'data_residency', 'TNF_DATA_RESIDENCY'],
  ['sensitivity', 'sensitivity', 'TNF_DATA_SENSITIVITY'],
];
function classificationReceipt(recordedClassification) {
  const record = recordedClassification || {};
  const value = {};
  const source = {};
  for (const [key, recordedKey, envName] of CLASSIFICATION_AXES) {
    const hint = String(process.env[envName] || '').trim().toLowerCase();
    const recorded = String(record[recordedKey] || '').trim().toLowerCase();
    if (hint && hint !== 'unknown') {
      value[key] = hint;
      source[key] = recorded && recorded !== hint ? `env-override(handoff=${recorded})` : 'env';
    } else if (recorded) {
      value[key] = recorded;
      source[key] = 'handoff';
    } else {
      value[key] = 'unknown';
      source[key] = 'unset';
    }
  }
  return { ...value, source };
}
function validateClassification(c) {
  const errors = [];
  if (!VALID.domain.has(c.workDomain)) errors.push(`invalid work domain: ${c.workDomain}`);
  if (!VALID.destination.has(c.artifactDestination)) errors.push(`invalid artifact destination: ${c.artifactDestination}`);
  if (!VALID.residency.has(c.dataResidency)) errors.push(`invalid data residency: ${c.dataResidency}`);
  if (!VALID.sensitivity.has(c.sensitivity)) errors.push(`invalid sensitivity: ${c.sensitivity}`);
  const publicDest = ['oss_runtime', 'public_contract'].includes(c.artifactDestination);
  if (publicDest && ['private', 'restricted'].includes(c.sensitivity)) errors.push(`${c.sensitivity} content cannot target ${c.artifactDestination}`);
  if (c.dataResidency === 'secret_machine_local' && c.artifactDestination !== 'external') errors.push('secret_machine_local data must remain external to repository source');
  if (['personal', 'agency'].includes(c.workDomain) && publicDest && c.sensitivity !== 'public') errors.push('personal/agency material must be sanitized to public product-neutral form before public destination');
  const unresolved = CLASSIFICATION_AXES.some(([key]) => c[key] === 'unknown');
  return { ok: errors.length === 0 && !unresolved, unresolved, errors };
}

function csv(name) { return String(process.env[name] || '').split(',').map((s) => s.trim()).filter(Boolean); }
function capabilityReceipt() { return { required: csv('TNF_REQUIRED_CAPABILITIES'), staffedBy: csv('TNF_STAFFED_BY') }; }

function hydrationReceipt(task = '') {
  const q = String(task || '').toLowerCase();
  const paths = [PRODUCT_MAP, OSS_BOUNDARY, PRODUCT_BOUNDARY, REPO_SEPARATION];
  if (/tnf|engineer|architect|implement|debug|review|refactor|code/.test(q)) {
    paths.push('.agent/skills/tnf-engineering-context/SKILL.md');
  }
  if (/source|drive|ledger|taxonomy|concordance|gemini|multi-agent|multi agent/.test(q)) {
    paths.push('docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md', '.agent/skills/tnf-source-concordance/SKILL.md');
  }
  if (/agent resource|resource fabric|resource convergence|consolidat|deduplicat|dedupe|host resource|local agent|shared skill|shared prompt|shared rule|zcode/.test(q)) {
    paths.push(
      'docs/protocols/TNF_AGENT_RESOURCE_CONVERGENCE_PROTOCOL.md',
      '.agent/skills/tnf-agent-resource-convergence/SKILL.md',
      'data/harness/agent-resource-fabric.json',
    );
  }
  if (/user context|storage|profile|google drive|memory|context persistence/.test(q)) {
    paths.push('docs/protocols/USER_CONTEXT_STORAGE_MANDATE.md', '.agent/skills/tnf-user-context-storage/SKILL.md');
  }
  if (/relay|broker|websocket|intent/.test(q)) paths.push('packages/relay-core');
  if (/front|ui|react|vite/.test(q)) paths.push('apps/frontend');
  if (/api|nest|gateway/.test(q)) paths.push('apps/api', 'apps/api-gateway');
  if (/chrome|browser extension/.test(q)) paths.push('apps/chrome-extension');
  if (/vscode/.test(q)) paths.push('apps/vscode-extension');
  if (/tauri|desktop/.test(q)) paths.push('apps/tauri-desktop');
  return [...new Set(paths)];
}

function safeJson(relPath) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8')); } catch { return null; }
}
function livingDirective() {
  try {
    const text = fs.readFileSync(path.join(ROOT, LIVING_STATE), 'utf8');
    const m = text.match(/<!-- CURRENT_DIRECTIVE:START -->\s*([\s\S]*?)\s*<!-- CURRENT_DIRECTIVE:END -->/);
    return m ? m[1].trim() : null;
  } catch { return null; }
}
function handoffRelation(handoffHead, currentHead) {
  if (!handoffHead || !currentHead) return { relation: 'unknown', commitsSince: null };
  if (handoffHead === currentHead) return { relation: 'exact', commitsSince: 0 };
  const mergeBase = git(['merge-base', handoffHead, currentHead]);
  if (!mergeBase) return { relation: 'unknown', commitsSince: null };
  if (mergeBase !== handoffHead) return { relation: 'diverged', commitsSince: null };
  const rawCount = git(['rev-list', '--count', `${handoffHead}..${currentHead}`]);
  const commitsSince = Number.parseInt(rawCount, 10);
  return { relation: 'ancestor', commitsSince: Number.isFinite(commitsSince) ? commitsSince : null };
}

function orientationSummary(repository) {
  const handoff = safeJson(HANDOFF);
  const productMap = safeJson(PRODUCT_MAP);
  const handoffHead = handoff?.head_sha || null;
  const relation = handoffRelation(handoffHead, repository.head);
  return {
    currentDirective: livingDirective(),
    handoff: handoff ? {
      id: handoff.handoff_id || null,
      createdAt: handoff.created_at || null,
      branch: handoff.branch || null,
      head: handoffHead,
      relationToCurrentHead: relation.relation,
      commitsSince: relation.commitsSince,
      freshAgainstCurrentHead: relation.relation === 'exact' || relation.relation === 'ancestor',
      nextActions: Array.isArray(handoff.next_actions) ? handoff.next_actions : [],
      resumeChecklist: Array.isArray(handoff.continuation?.resume_checklist) ? handoff.continuation.resume_checklist : [],
      classification: handoff.classification && typeof handoff.classification === 'object' ? handoff.classification : null,
    } : null,
    canonicalDevelopment: productMap?.policy?.canonicalDevelopment || CANONICAL,
    onboardingContractPresent: fs.existsSync(path.join(ROOT, ONBOARDING_CONTRACT)),
  };
}

function taskHydrationStatus(paths) {
  return paths.map((relPath) => ({
    path: relPath,
    present: fs.existsSync(path.join(ROOT, relPath)),
  }));
}

function printFreshness() {
  const gate = path.join(ROOT, 'scripts/protocols/state-freshness-gate.cjs');
  if (!fs.existsSync(gate)) return '- freshness gate missing';
  const out = spawnSync(process.execPath, [gate, '--frontload'], { cwd: ROOT, encoding: 'utf8', timeout: 20000 });
  return String(out.stdout || '').trim() || '- freshness unavailable; treat volatile state as unknown';
}

function parseArgs(argv) {
  const idx = argv.indexOf('--task');
  const consumerIdx = argv.indexOf('--consumer');
  return {
    json: argv.includes('--json'),
    requireWriteReady: argv.includes('--require-write-ready'),
    writeReceipt: argv.includes('--write-receipt'),
    task: idx >= 0 ? argv[idx + 1] || '' : '',
    consumer: consumerIdx >= 0 ? argv[consumerIdx + 1] || 'unknown' : (process.env.TNF_HARNESS_CONSUMER || 'turn-zero-v2'),
  };
}

function persistReceipt(payload) {
  const abs = path.join(ROOT, RUNTIME_RECEIPT);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return RUNTIME_RECEIPT;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repository = repoReceipt();
  const orientation = orientationSummary(repository);
  const classification = classificationReceipt(orientation.handoff?.classification);
  const classificationValidation = validateClassification(classification);
  const capabilities = capabilityReceipt();
  const stageA = hydrateStage({ root: ROOT, stage: 'A', consumer: args.consumer });
  const taskHydration = hydrationReceipt(args.task || process.env.TNF_TASK || '');
  const taskHydrationState = taskHydrationStatus(taskHydration);
  const blockers = [];
  const warnings = [];

  if (!stageA.ok) blockers.push('manifest-derived Stage A hydration is incomplete');
  if (repository.publicationTarget) blockers.push(`origin ${repository.normalizedOrigin} is a downstream publication target; develop internally in ${CANONICAL} or work from an external fork`);
  if (repository.mode === 'external-or-fork') warnings.push('external/fork mode: private monorepo state is not assumed; upstream placement must follow public contribution/product-boundary rules');
  if (repository.mode === 'unknown') warnings.push('repository origin could not be classified');
  if (repository.operationInProgress) blockers.push(`git ${repository.operationInProgress} is in progress`);
  if (orientation.handoff?.relationToCurrentHead === 'diverged') warnings.push('SESSION_HANDOFF_LATEST diverges from current HEAD; treat it as historical continuation context until reconciled');
  if (orientation.handoff?.relationToCurrentHead === 'unknown') warnings.push('SESSION_HANDOFF_LATEST relation to current HEAD could not be proven; treat freshness as unknown');
  if (orientation.handoff?.relationToCurrentHead === 'ancestor' && (orientation.handoff.commitsSince || 0) > 0) warnings.push(`SESSION_HANDOFF_LATEST is an ancestor ${orientation.handoff.commitsSince} commit(s) behind current HEAD; inspect intervening commits before relying on continuation details`);
  for (const item of taskHydrationState) {
    if (!item.present && /USER_CONTEXT_STORAGE/.test(item.path)) warnings.push(`${item.path} is not on this branch; storage work may live on an active PR and must be reconciled before implementation`);
  }
  // Validate-on-read: the handoff is a plain file in a shared checkout, so any
  // agent with a file-write tool can replace it. Never classify or resume from
  // a record that does not satisfy its own schema.
  const handoffValidation = validateHandoff();
  if (!handoffValidation.ok) {
    const detail = handoffValidation.findings.slice(0, 3).map((f) => `${f.pointer || '<root>'}: ${f.message}`).join('; ');
    warnings.push(`SESSION_HANDOFF_LATEST fails its schema (${handoffValidation.findings.length} finding(s)) — treat continuation context as unknown: ${detail}`);
    for (const signal of handoffValidation.signals) warnings.push(`handoff fabrication signal — ${signal}`);
    if (args.requireWriteReady) blockers.push(`SESSION_HANDOFF_LATEST is not schema-valid; recover it before mutating (node scripts/protocols/validate-session-handoff.cjs)`);
  }

  for (const [key] of CLASSIFICATION_AXES) {
    if (String(classification.source[key]).startsWith('env-override')) {
      warnings.push(`classification ${key} taken from environment hint, overriding the recorded handoff value (${classification.source[key]}); the handoff is the record per TURN_ZERO_MANDATE`);
    }
  }
  if (args.requireWriteReady && !classificationValidation.ok) {
    blockers.push(...classificationValidation.errors);
    if (classificationValidation.unresolved) blockers.push('classification is unresolved');
  }

  const payload = {
    protocol: 'TNF_TURN_ZERO_V2',
    canonicalSource: CANONICAL,
    lifecycle: ['RESPOND','ORIENT','CLASSIFY','HYDRATE','STAFF','ACT','VERIFY','PROPAGATE','HANDOFF'],
    repository,
    stageA,
    orientation,
    classification,
    classificationValidation,
    capabilities,
    taskHydration,
    taskHydrationState,
    harnessed: stageA.ok,
    writeReady: blockers.length === 0 && classificationValidation.ok,
    blockers,
    warnings,
  };
  if (args.writeReceipt) payload.receiptPath = persistReceipt(payload);

  if (args.json) console.log(JSON.stringify(payload, null, 2));
  else {
    console.log('=== Turn Zero V2 / Harness Receipt ===');
    console.log(`- repository: ${repository.normalizedOrigin || 'unknown'} @ ${repository.branch}:${repository.head.slice(0,12) || 'unknown'}`);
    console.log(`- repository mode: ${repository.mode}`);
    console.log(`- Stage A manifest hydration: ${stageA.ok ? 'PASS' : 'FAIL'} (${stageA.entries.length} rails)`);
    for (const rail of stageA.entries) console.log(`  ${rail.status === 'loaded' ? 'OK' : 'FAIL'} ${rail.path}${rail.sha256 ? ` @ ${rail.sha256.slice(0,12)}` : ''}`);
    console.log(`- current directive: ${orientation.currentDirective || 'unknown'}`);
    if (orientation.handoff) {
      const relationLabel = orientation.handoff.relationToCurrentHead === 'ancestor'
        ? `ancestor +${orientation.handoff.commitsSince ?? '?'} commit(s)`
        : orientation.handoff.relationToCurrentHead;
      console.log(`- handoff: ${orientation.handoff.id || 'unknown'} @ ${orientation.handoff.head ? orientation.handoff.head.slice(0,12) : 'unknown'} (${relationLabel || 'unknown'})`);
      for (const action of orientation.handoff.nextActions.slice(0, 4)) console.log(`  next: ${action}`);
    }
    console.log(`- classification: ${classification.workDomain} / ${classification.artifactDestination} / ${classification.dataResidency} / ${classification.sensitivity}`);
    console.log(`  source: ${CLASSIFICATION_AXES.map(([key]) => `${key}=${classification.source[key]}`).join(' ')}`);
    console.log('- task-scoped hydration plan:');
    for (const item of taskHydrationState) console.log(`  ${item.present ? 'OK' : 'MISS'} ${item.path}`);
    warnings.forEach((w) => console.log(`▲ ${w}`));
    console.log('\n=== State Freshness ===');
    console.log(printFreshness());
    if (blockers.length) {
      console.log('\n=== Readiness Blockers ===');
      blockers.forEach((b) => console.log(`! ${b}`));
    } else {
      console.log(`\n- harness state: ${payload.harnessed ? 'PASS' : 'FAIL'}`);
      console.log(`- write readiness: ${payload.writeReady ? 'PASS' : 'UNRESOLVED (use --require-write-ready before mutation)'}`);
    }
    if (payload.receiptPath) console.log(`- receipt: ${payload.receiptPath}`);
  }
  if (args.requireWriteReady && blockers.length) process.exit(1);
  if (!stageA.ok) process.exit(1);
}

if (require.main === module) main();
module.exports = {
  normalizeOrigin,
  repositoryMode,
  validateClassification,
  hydrationReceipt,
  repoReceipt,
  classificationReceipt,
  orientationSummary,
  handoffRelation,
  taskHydrationStatus,
};
