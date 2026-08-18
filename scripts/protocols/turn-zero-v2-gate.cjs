#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const CANONICAL = 'whodaniel/tnf-monorepo';
const PUBLICATION_TARGETS = new Set(['whodaniel/the-new-fuse', 'whodaniel/fuse-control-plane']);
const PRODUCT_MAP = 'data/distribution/product-repo-map.json';
const OSS_BOUNDARY = 'data/distribution/oss-app-boundary.json';
const PRODUCT_BOUNDARY = 'docs/product/TNF_PRODUCT_BOUNDARY.md';
const REPO_SEPARATION = 'docs/REPO_SEPARATION.md';

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
  domain: new Set(['corporate', 'agency', 'personal', 'unknown']),
  destination: new Set(['oss_runtime', 'public_contract', 'private_control_plane', 'satellite', 'external', 'unknown']),
  residency: new Set(['product_state', 'bounded_working', 'external_durable', 'secret_machine_local', 'unknown']),
  sensitivity: new Set(['public', 'internal', 'private', 'restricted', 'unknown']),
};

function envOrUnknown(name) { return String(process.env[name] || 'unknown').trim().toLowerCase(); }
function classificationReceipt() {
  return {
    workDomain: envOrUnknown('TNF_WORK_DOMAIN'),
    artifactDestination: envOrUnknown('TNF_ARTIFACT_DESTINATION'),
    dataResidency: envOrUnknown('TNF_DATA_RESIDENCY'),
    sensitivity: envOrUnknown('TNF_DATA_SENSITIVITY'),
  };
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
  const unresolved = Object.values(c).some((value) => value === 'unknown');
  return { ok: errors.length === 0 && !unresolved, unresolved, errors };
}

function csv(name) { return String(process.env[name] || '').split(',').map((s) => s.trim()).filter(Boolean); }
function capabilityReceipt() { return { required: csv('TNF_REQUIRED_CAPABILITIES'), staffedBy: csv('TNF_STAFFED_BY') }; }

function hydrationReceipt(task = '') {
  const q = String(task || '').toLowerCase();
  const paths = [PRODUCT_MAP, OSS_BOUNDARY, PRODUCT_BOUNDARY, REPO_SEPARATION];
  if (/relay|broker|websocket|context|intent/.test(q)) paths.push('packages/relay-core');
  if (/front|ui|react|vite/.test(q)) paths.push('apps/frontend');
  if (/api|nest|gateway/.test(q)) paths.push('apps/api', 'apps/api-gateway');
  if (/chrome|browser extension/.test(q)) paths.push('apps/chrome-extension');
  if (/vscode/.test(q)) paths.push('apps/vscode-extension');
  if (/tauri|desktop/.test(q)) paths.push('apps/tauri-desktop');
  return [...new Set(paths)];
}

function printFreshness() {
  const gate = path.join(ROOT, 'scripts/protocols/state-freshness-gate.cjs');
  if (!fs.existsSync(gate)) return '- freshness gate missing';
  const out = spawnSync(process.execPath, [gate, '--frontload'], { cwd: ROOT, encoding: 'utf8', timeout: 20000 });
  return String(out.stdout || '').trim() || '- freshness unavailable; treat volatile state as unknown';
}

function parseArgs(argv) {
  const idx = argv.indexOf('--task');
  return { json: argv.includes('--json'), requireWriteReady: argv.includes('--require-write-ready'), task: idx >= 0 ? argv[idx + 1] || '' : '' };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repository = repoReceipt();
  const classification = classificationReceipt();
  const classificationValidation = validateClassification(classification);
  const capabilities = capabilityReceipt();
  const hydration = hydrationReceipt(args.task || process.env.TNF_TASK || '');
  const blockers = [];
  const warnings = [];

  if (repository.publicationTarget) blockers.push(`origin ${repository.normalizedOrigin} is a downstream publication target; develop internally in ${CANONICAL} or work from an external fork`);
  if (repository.mode === 'external-or-fork') warnings.push(`external/fork mode: upstream placement must follow public contribution and product-boundary rules; private TNF source is not assumed available`);
  if (repository.mode === 'unknown') warnings.push('repository origin could not be classified');
  if (repository.operationInProgress) blockers.push(`git ${repository.operationInProgress} is in progress`);
  if (args.requireWriteReady && !classificationValidation.ok) {
    blockers.push(...classificationValidation.errors);
    if (classificationValidation.unresolved) blockers.push('classification is unresolved');
  }

  const payload = {
    protocol: 'TNF_TURN_ZERO_V2',
    canonicalSource: CANONICAL,
    lifecycle: ['RESPOND','ORIENT','CLASSIFY','HYDRATE','STAFF','ACT','VERIFY','PROPAGATE','HANDOFF'],
    repository, classification, classificationValidation, capabilities, hydration,
    writeReady: blockers.length === 0, blockers, warnings,
  };

  if (args.json) console.log(JSON.stringify(payload, null, 2));
  else {
    console.log('=== Turn Zero V2 ===');
    console.log(`- repository: ${repository.normalizedOrigin || 'unknown'} @ ${repository.branch}:${repository.head.slice(0,12) || 'unknown'}`);
    console.log(`- repository mode: ${repository.mode}`);
    console.log(`- canonical TNF source: ${CANONICAL}`);
    console.log(`- classification: ${classification.workDomain} / ${classification.artifactDestination} / ${classification.dataResidency} / ${classification.sensitivity}`);
    warnings.forEach((w) => console.log(`▲ ${w}`));
    console.log('- task-scoped hydration:'); hydration.forEach((p) => console.log(`  - ${p}`));
    console.log('\n=== State Freshness ==='); console.log(printFreshness());
    if (blockers.length) { console.log('\n=== Write Readiness ==='); blockers.forEach((b) => console.log(`! ${b}`)); }
    else console.log('\n- write readiness: PASS');
  }
  if (args.requireWriteReady && blockers.length) process.exit(1);
}

if (require.main === module) main();
module.exports = { normalizeOrigin, repositoryMode, validateClassification, hydrationReceipt, repoReceipt, classificationReceipt };
