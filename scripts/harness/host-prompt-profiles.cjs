#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const HOME = os.homedir();
const CATALOG = path.join(ROOT, 'data/harness/host-prompt-profiles.json');
const RECEIPT = path.join(ROOT, '.agent/runtime-logs/host-prompt-profiles.latest.json');

function expand(rel) {
  if (rel.startsWith('~/')) return path.join(HOME, rel.slice(2));
  if (rel.startsWith('/')) return rel;
  return path.join(ROOT, rel);
}

function parseArgs(argv) {
  return {
    verify: argv.includes('--verify') || !argv.includes('--json'),
    json: argv.includes('--json'),
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const rows = [];
  for (const host of catalog.hosts || []) {
    const files = (host.expected_files || []).map((rel) => {
      const abs = expand(rel);
      const exists = fs.existsSync(abs);
      let pointer = false;
      if (exists && fs.statSync(abs).isFile()) {
        const body = fs.readFileSync(abs, 'utf8');
        pointer = /tnf:onboard|FRONTLOAD_MANIFEST|TNF-FRONTLOAD|TNF-HARNESS-INJECTION/.test(body);
      }
      return { path: rel, exists, pointer, enlisted: exists };
    });
    const present = files.filter((f) => f.exists).length;
    rows.push({
      id: host.id,
      runtime: host.runtime,
      scope: host.scope,
      enlisted: present > 0,
      present,
      expected: files.length,
      files,
    });
  }

  const payload = {
    ok: true,
    at: new Date().toISOString(),
    authority: 'data/harness/host-prompt-profiles.json',
    enlisted: rows.filter((r) => r.enlisted).map((r) => r.id),
    absent: rows.filter((r) => !r.enlisted).map((r) => r.id),
    hosts: rows,
  };

  fs.mkdirSync(path.dirname(RECEIPT), { recursive: true });
  fs.writeFileSync(RECEIPT, `${JSON.stringify(payload, null, 2)}\n`);

  if (opts.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log('TNF host prompt profiles\n');
  for (const row of rows) {
    const mark = row.enlisted ? 'ENLISTED' : 'absent';
    console.log(`  ${row.id.padEnd(16)} ${mark.padEnd(10)} ${row.present}/${row.expected} files  (${row.runtime})`);
  }
  console.log(`\nEnlisted: ${payload.enlisted.join(', ') || '(none)'}`);
  console.log(`Absent (advisory): ${payload.absent.join(', ') || '(none)'}`);
  console.log('Missing files for an unenlisted host are not a TNF-wide failure.');
  console.log(`Receipt: ${path.relative(ROOT, RECEIPT)}`);
}

try {
  main();
} catch (error) {
  console.error(`host-prompt-profiles: ${error.message}`);
  process.exit(1);
}
