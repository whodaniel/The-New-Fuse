#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SCAN_ROOTS = [
  path.join(ROOT, 'apps/api/src'),
  path.join(ROOT, 'packages/database/src'),
];

const failures = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && /\.(?:ts|tsx|js|cjs|mjs)$/.test(entry.name) ? [full] : [];
  });
}

for (const file of SCAN_ROOTS.flatMap(walk)) {
  const source = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  // Manual quote escaping adjacent to raw SQL is a regression signal. Values
  // must be bound through executeRaw(query, params), not interpolated.
  if (source.includes('executeRaw') && /replace\(\s*\/['"]\/g\s*,/.test(source)) {
    failures.push(`${rel}: manual quote escaping found in a file using executeRaw`);
  }

  // Direct template interpolation inside executeRaw is forbidden. This is
  // deliberately strict for application/database code; dynamic identifiers
  // should use a reviewed query builder rather than string-built raw SQL.
  const rawCall = /executeRaw(?:<[^;()]*>)?\s*\(\s*`([\s\S]*?)`\s*(?:,|\))/g;
  for (const match of source.matchAll(rawCall)) {
    if (match[1].includes('${')) {
      failures.push(`${rel}: template interpolation found inside executeRaw`);
      break;
    }
  }
}

const databaseService = path.join(ROOT, 'packages/database/src/drizzle/database.service.ts');
const dbSource = fs.readFileSync(databaseService, 'utf8');
if (!/executeRaw<T\s*=\s*unknown>\(query:\s*string,\s*params\?:\s*unknown\[\]\)/.test(dbSource)) {
  failures.push('packages/database/src/drizzle/database.service.ts: executeRaw parameter API missing');
}
if (!dbSource.includes('queryClient.unsafe(query, params as any[])')) {
  failures.push('packages/database/src/drizzle/database.service.ts: parameter binding path missing');
}

if (failures.length) {
  console.error('RAW SQL PARAMETERIZATION GATE: FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('RAW SQL PARAMETERIZATION GATE: PASS');
