#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const writeBaseline = args.includes('--write-baseline');
const baselineArg = args.find((arg) => arg.startsWith('--baseline='));
const baselinePath = baselineArg
  ? baselineArg.split('=').slice(1).join('=')
  : 'scripts/security/supabase-rls-baseline.json';

const defaultScanRoots = [
  'supabase/tables',
  'supabase/migrations',
  'apps/virtual-library-blueprints/supabase/migrations',
];

function parseScanRoots() {
  const raw = process.env.SUPABASE_RLS_AUDIT_SCAN_ROOTS || '';
  if (!raw.trim()) return defaultScanRoots;
  const provided = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!provided.length) return defaultScanRoots;
  return [...new Set(provided)];
}

function walkSqlFiles(root) {
  if (!fs.existsSync(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current)) {
        stack.push(path.join(current, entry));
      }
      continue;
    }
    if (current.toLowerCase().endsWith('.sql')) out.push(current);
  }
  return out;
}

function normalizeIdent(raw) {
  if (!raw) return '';
  return raw.replace(/["`;]/g, '').trim().toLowerCase();
}

function normalizeTable(raw) {
  const ident = normalizeIdent(raw);
  if (!ident) return '';
  if (ident.includes('.')) return ident;
  return `public.${ident}`;
}

function collectTables(content) {
  const createdTables = new Set();
  const rlsEnabledTables = new Set();
  const policyTables = new Set();

  const createTableRegex = /create\s+table(?:\s+if\s+not\s+exists)?\s+([a-zA-Z0-9_".]+)/gi;
  const enableRlsRegex = /alter\s+table(?:\s+if\s+exists)?\s+([a-zA-Z0-9_".]+)\s+enable\s+row\s+level\s+security/gi;
  const createPolicyRegex = /create\s+policy\s+.+?\s+on\s+([a-zA-Z0-9_".]+)/gi;

  let match;
  while ((match = createTableRegex.exec(content)) !== null) {
    createdTables.add(normalizeTable(match[1]));
  }
  while ((match = enableRlsRegex.exec(content)) !== null) {
    rlsEnabledTables.add(normalizeTable(match[1]));
  }
  while ((match = createPolicyRegex.exec(content)) !== null) {
    policyTables.add(normalizeTable(match[1]));
  }

  return { createdTables, rlsEnabledTables, policyTables };
}

function loadBaseline(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { missingRls: [], missingPolicy: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      missingRls: Array.isArray(parsed.missingRls) ? parsed.missingRls : [],
      missingPolicy: Array.isArray(parsed.missingPolicy) ? parsed.missingPolicy : [],
    };
  } catch {
    return { missingRls: [], missingPolicy: [] };
  }
}

function diffSet(currentList, baselineList) {
  const baseline = new Set(baselineList);
  return currentList.filter((item) => !baseline.has(item));
}

function main() {
  const scanRoots = parseScanRoots();
  const files = scanRoots.flatMap((root) => walkSqlFiles(root));
  const createdTables = new Set();
  const rlsEnabledTables = new Set();
  const policyTables = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const tableSets = collectTables(content);
    for (const table of tableSets.createdTables) createdTables.add(table);
    for (const table of tableSets.rlsEnabledTables) rlsEnabledTables.add(table);
    for (const table of tableSets.policyTables) policyTables.add(table);
  }

  const createdPublicTables = [...createdTables]
    .filter((table) => table.startsWith('public.'))
    .sort();

  const missingRls = createdPublicTables.filter((table) => !rlsEnabledTables.has(table));
  const missingPolicy = createdPublicTables.filter(
    (table) => rlsEnabledTables.has(table) && !policyTables.has(table),
  );

  if (writeBaseline) {
    const payload = {
      generatedAt: new Date().toISOString(),
      scanRoots,
      missingRls,
      missingPolicy,
    };
    fs.writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`[supabase-rls-audit] baseline written: ${baselinePath}`);
    console.log(
      `[supabase-rls-audit] missingRls=${missingRls.length} missingPolicy=${missingPolicy.length}`,
    );
    return;
  }

  const baseline = loadBaseline(baselinePath);
  const unresolvedMissingRls = diffSet(missingRls, baseline.missingRls);
  const unresolvedMissingPolicy = diffSet(missingPolicy, baseline.missingPolicy);

  console.log(`[supabase-rls-audit] scanned files: ${files.length}`);
  console.log(`[supabase-rls-audit] public tables: ${createdPublicTables.length}`);
  console.log(
    `[supabase-rls-audit] missingRls=${missingRls.length} (new=${unresolvedMissingRls.length})`,
  );
  console.log(
    `[supabase-rls-audit] missingPolicy=${missingPolicy.length} (new=${unresolvedMissingPolicy.length})`,
  );

  if (unresolvedMissingRls.length) {
    console.error('[supabase-rls-audit] New public tables missing RLS:');
    for (const table of unresolvedMissingRls) console.error(`  - ${table}`);
  }
  if (unresolvedMissingPolicy.length) {
    console.error('[supabase-rls-audit] New public tables with RLS but no policy:');
    for (const table of unresolvedMissingPolicy) console.error(`  - ${table}`);
  }

  if (strict && (unresolvedMissingRls.length || unresolvedMissingPolicy.length)) {
    process.exit(1);
  }
}

main();
