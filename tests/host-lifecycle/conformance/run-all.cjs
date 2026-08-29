#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '../../..');

function run(cmd, args) {
  console.log(`\n=== ${cmd} ${args.join(' ')} ===`);
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: 'inherit' });
  return r.status ?? 1;
}

const jsTests = fs
  .readdirSync(HERE)
  .filter((f) => f.endsWith('.test.cjs'))
  .map((f) => path.join(HERE, f));

let code = 0;
code = run(process.execPath, ['--test', ...jsTests]) || code;
code = run('python3', [path.join(HERE, 'run_python_conformance.py')]) || code;
process.exit(code);
