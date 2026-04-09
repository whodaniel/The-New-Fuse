#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node scripts/skills/skill-bank-query.cjs <query> [--index .agent/skill-bank/skills-index.json]');
}

function parseArgs(argv) {
  let query = '';
  let indexPath = '.agent/skill-bank/skills-index.json';
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--index' && argv[i + 1]) {
      indexPath = argv[i + 1];
      i += 1;
    } else if (!query) {
      query = a;
    }
  }
  return { query, indexPath };
}

function main() {
  const { query, indexPath } = parseArgs(process.argv);
  if (!query) {
    usage();
    process.exit(1);
  }

  const file = path.resolve(process.cwd(), indexPath);
  if (!fs.existsSync(file)) {
    console.error(`Index not found: ${file}`);
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(file, 'utf8'));
  const q = query.toLowerCase();
  const matches = (index.skills || []).filter((s) => {
    if ((s.id || '').toLowerCase().includes(q)) return true;
    if ((s.canonicalName || '').toLowerCase().includes(q)) return true;
    if ((s.descriptions || []).join(' ').toLowerCase().includes(q)) return true;
    return false;
  });

  if (matches.length === 0) {
    console.log('No matches.');
    return;
  }

  for (const skill of matches.slice(0, 40)) {
    console.log(`${skill.id} | variants=${skill.variants.length} | llms=${Object.keys(skill.llms).join(',')}`);
    const sample = skill.variants[0];
    if (sample && sample.path) console.log(`  path: ${sample.path}`);
  }
}

main();
