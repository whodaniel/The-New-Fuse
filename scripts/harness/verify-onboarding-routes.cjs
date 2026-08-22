#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const CONTRACT = path.join(ROOT, 'data/harness/onboarding-contract.json');
const PACKAGE_JSON = path.join(ROOT, 'package.json');

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function main() {
  const jsonMode = process.argv.includes('--json');
  const checks = [];
  if (!fs.existsSync(CONTRACT)) {
    checks.push({ id: 'contract', ok: false, detail: 'data/harness/onboarding-contract.json missing' });
  } else {
    let contract;
    try {
      contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
      checks.push({ id: 'contract', ok: true, detail: `version=${contract.version || 'unknown'}` });
    } catch (err) {
      checks.push({ id: 'contract', ok: false, detail: `invalid JSON: ${err.message}` });
    }

    if (contract) {
      const entry = String(contract.standardEntryPoint || '');
      let packageJson = null;
      try { packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8')); } catch {}
      const tnfOnboard = packageJson?.scripts?.['tnf:onboard'];
      checks.push({
        id: 'entrypoint',
        ok: entry === 'pnpm run tnf:onboard' && Boolean(tnfOnboard),
        detail: tnfOnboard ? `${entry} -> ${tnfOnboard}` : 'package.json tnf:onboard script missing',
      });

      for (const [index, route] of (contract.taskRoutes || []).entries()) {
        for (const rel of route.load || []) {
          checks.push({
            id: `route.${index}.required.${rel}`,
            ok: exists(rel),
            detail: exists(rel) ? 'present' : `required route target missing: ${rel}`,
          });
        }
        for (const rel of route.loadIfPresent || []) {
          checks.push({
            id: `route.${index}.optional.${rel}`,
            ok: true,
            optional: true,
            detail: exists(rel) ? 'present' : 'optional route target absent on this branch',
          });
        }
      }

      const manifest = contract.authority?.frontloadManifest;
      const mandate = contract.authority?.turnZero;
      for (const [id, rel] of [['frontloadManifest', manifest], ['turnZero', mandate]]) {
        checks.push({
          id: `authority.${id}`,
          ok: Boolean(rel) && exists(rel),
          detail: rel && exists(rel) ? rel : `missing authority target: ${rel || '<unset>'}`,
        });
      }
    }
  }

  const failed = checks.filter((row) => !row.ok && !row.optional);
  const result = {
    ok: failed.length === 0,
    checkedAt: new Date().toISOString(),
    contract: 'data/harness/onboarding-contract.json',
    failed: failed.map((row) => row.id),
    checks,
  };

  if (jsonMode) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('TNF onboarding route integrity');
    for (const row of checks) console.log(`${row.ok ? 'OK' : 'FAIL'}: ${row.id} — ${row.detail}`);
    console.log(result.ok ? '\nONBOARDING ROUTE INTEGRITY PASS' : `\n${failed.length} required route(s) failed`);
  }
  process.exit(result.ok ? 0 : 1);
}

main();
