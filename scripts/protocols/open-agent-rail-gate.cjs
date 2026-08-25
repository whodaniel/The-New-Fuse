#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const CONTRACT = path.join(ROOT, 'data/harness/open-agent-contract.json');
const MANIFEST = path.join(ROOT, 'docs/core/FRONTLOAD_MANIFEST.md');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function readUtf8(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
    noWrite: argv.includes('--no-write'),
    quiet: argv.includes('--quiet'),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const checks = [];
  const fail = (id, detail) => checks.push({ id, ok: false, detail });
  const pass = (id, detail) => checks.push({ id, ok: true, detail });

  if (!fs.existsSync(CONTRACT)) {
    fail('contract', 'data/harness/open-agent-contract.json missing');
    finish(args, checks, null);
    return;
  }

  let contract;
  try {
    contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
    pass('contract', `${contract.spec || 'unknown'} loaded`);
  } catch (error) {
    fail('contract', `invalid JSON: ${error.message}`);
    finish(args, checks, null);
    return;
  }

  const rails = [];
  for (const rel of contract.requiredRails || []) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      fail(`rail:${rel}`, 'missing');
      continue;
    }
    const stat = fs.statSync(abs);
    if (!stat.isFile()) {
      fail(`rail:${rel}`, 'not a file');
      continue;
    }
    const hash = sha256(abs);
    rails.push({ path: rel, sha256: hash, bytes: stat.size });
    pass(`rail:${rel}`, hash.slice(0, 16));
  }

  let manifest = '';
  try {
    manifest = fs.readFileSync(MANIFEST, 'utf8');
  } catch {
    fail('manifest', 'FRONTLOAD_MANIFEST.md unreadable');
  }

  const mandatoryManifestRefs = [
    '.agent/SYSTEM_PROMPT.md',
    'docs/protocols/TNF_INTEROPERABILITY_KERNEL.md',
    'docs/protocols/TNF_OPEN_AGENT_CORE.md',
    'docs/protocols/TURN_ZERO_MANDATE.md',
  ];
  for (const rel of mandatoryManifestRefs) {
    if (manifest.includes(rel)) pass(`manifest:${rel}`, 'referenced');
    else fail(`manifest:${rel}`, 'not referenced by public frontload manifest');
  }

  const semanticSources = [
    '.agent/SYSTEM_PROMPT.md',
    'docs/protocols/TNF_INTEROPERABILITY_KERNEL.md',
    'docs/protocols/TNF_OPEN_AGENT_CORE.md',
  ]
    .filter((rel) => fs.existsSync(path.join(ROOT, rel)))
    .map((rel) => readUtf8(rel))
    .join('\n');

  for (const primitive of contract.semanticKernel || []) {
    if (semanticSources.toLowerCase().includes(String(primitive).toLowerCase())) {
      pass(`semantic:${primitive}`, 'present');
    } else {
      fail(`semantic:${primitive}`, 'missing from public agent rail');
    }
  }

  const lifecycleText = (contract.lifecycle || []).join(' → ');
  const normalizedSources = semanticSources.replace(/->/g, '→');
  const lifecyclePresent =
    (contract.lifecycle || []).every((step) =>
      normalizedSources.toUpperCase().includes(String(step).toUpperCase())
    );
  if (lifecyclePresent) pass('lifecycle', lifecycleText);
  else fail('lifecycle', `one or more steps missing: ${lifecycleText}`);

  const localAutonomySignals = [
    'without the hosted',
    'local policy',
    'capability does not imply authority',
    'verification outranks narrative',
  ];
  const lower = semanticSources.toLowerCase();
  for (const signal of localAutonomySignals) {
    if (lower.includes(signal)) pass(`autonomy:${signal}`, 'present');
    else fail(`autonomy:${signal}`, 'missing');
  }

  const receipt = {
    spec: 'tnf/open-agent-rail-receipt/0.1',
    generatedAt: new Date().toISOString(),
    contract: contract.spec,
    root: ROOT,
    rails,
    checks,
    ok: checks.every((check) => check.ok),
  };

  finish(args, checks, receipt);
}

function finish(args, checks, receipt) {
  const ok = checks.length > 0 && checks.every((check) => check.ok);
  if (receipt && !args.noWrite) {
    const out = path.join(os.homedir(), '.tnf', 'runtime', 'open-agent-rail.latest.json');
    try {
      fs.mkdirSync(path.dirname(out), { recursive: true, mode: 0o700 });
      fs.writeFileSync(out, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
      receipt.receiptPath = out;
    } catch (error) {
      checks.push({ id: 'receipt-write', ok: false, detail: error.message });
    }
  }

  const finalOk = checks.length > 0 && checks.every((check) => check.ok);
  if (args.json) {
    console.log(JSON.stringify(receipt || { ok: finalOk, checks }, null, 2));
  } else if (!args.quiet) {
    console.log('TNF Open Agent Rail Gate');
    for (const check of checks) {
      console.log(`${check.ok ? 'OK' : 'FAIL'}: ${check.id} — ${check.detail}`);
    }
    console.log(finalOk ? '\nOPEN_AGENT_RAIL: PASS' : '\nOPEN_AGENT_RAIL: FAIL');
  }
  process.exitCode = finalOk ? 0 : 1;
}

main();
