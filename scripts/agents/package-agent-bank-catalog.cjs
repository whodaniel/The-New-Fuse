#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Package TNF + Claude agent banks into a durable catalog for Cloud/API.
 * Source: .agent/agents + .claude/agents
 * Output: data/agent-bank/catalog.json (+ frontend public mirror)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BANKS = [
  { bank: 'tnf', dir: path.join(ROOT, '.agent', 'agents') },
  { bank: 'claude', dir: path.join(ROOT, '.claude', 'agents') },
];

function readTitleAndDescription(filePath, fallbackName) {
  let name = fallbackName;
  let description = '';
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const titleLine = lines.find((l) => l.startsWith('# '));
    if (titleLine) name = titleLine.replace(/^#\s+/, '').trim();
    const descLine = lines.find(
      (l) =>
        l.trim() &&
        !l.startsWith('#') &&
        !l.startsWith('---') &&
        !l.startsWith('```') &&
        !l.startsWith('- ')
    );
    if (descLine) description = descLine.trim().slice(0, 280);
  } catch {
    // keep fallbacks
  }
  return { name, description };
}

function scanBank(bankType, dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md') || file.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      const fallback = file.replace(/\.(md|json)$/, '');
      const { name, description } = readTitleAndDescription(fullPath, fallback);
      return {
        id: `${bankType}:${file}`,
        name,
        bank: bankType,
        filename: file,
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
        description,
        category: bankType === 'tnf' ? 'TNF Bank' : 'Claude Bank',
        sourcePath: path.posix.join(
          bankType === 'tnf' ? '.agent/agents' : '.claude/agents',
          file
        ),
      };
    });
}

function main() {
  const templates = BANKS.flatMap(({ bank, dir }) => scanBank(bank, dir));
  const catalog = {
    generatedAt: new Date().toISOString(),
    protocol: 'tnf/agent-bank-catalog/1.0',
    totals: {
      all: templates.length,
      tnf: templates.filter((t) => t.bank === 'tnf').length,
      claude: templates.filter((t) => t.bank === 'claude').length,
    },
    templates,
  };

  const outDirs = [
    path.join(ROOT, 'data', 'agent-bank'),
    path.join(ROOT, 'apps', 'frontend', 'public', 'agent-bank'),
    path.join(ROOT, 'apps', 'api', 'assets', 'agent-bank'),
  ];

  for (const dir of outDirs) {
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'catalog.json');
    fs.writeFileSync(out, JSON.stringify(catalog, null, 2) + '\n');
    console.log(`wrote ${out} (${catalog.totals.all} templates)`);
  }
}

main();
