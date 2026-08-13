#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const textExtensions = new Set([
  '.md',
  '.txt',
  '.json',
  '.jsonl',
  '.yaml',
  '.yml',
  '.env',
  '.js',
  '.cjs',
  '.mjs',
  '.ts',
  '.tsx',
  '.py',
  '.go',
  '.patch',
  '.d',
  '.toml',
  '.ini',
  '.sh',
  '.sql',
  '.csv',
  '.html',
  '.xml',
]);

const replacements = [
  { from: /\/Users\/[A-Za-z0-9._-]+/gi, to: '/Users/<redacted-user>' },
  { from: /whodaniel@yahoo\.com/gi, to: 'owner@example.com' },
  { from: /bizsynth@gmail\.com/gi, to: 'owner@example.com' },
  { from: /danielgoldberg@thenewfuse\.com/gi, to: 'owner@example.com' },
  { from: /admin@bizsynth\.com/gi, to: 'owner@example.com' },
];

function gitLsFiles() {
  const out = execFileSync('git', ['ls-files'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 256,
  }).trim();
  if (!out) return [];
  return out.split('\n').filter(Boolean);
}

function isTextFile(filePath) {
  const base = path.basename(filePath).toLowerCase();
  if (base === '.env' || base.startsWith('.env.')) return true;
  const ext = path.extname(filePath).toLowerCase();
  if (textExtensions.has(ext)) return true;
  if (!ext) {
    try {
      const buf = fs.readFileSync(filePath);
      const sample = buf.subarray(0, 4096);
      return !sample.includes(0);
    } catch {
      return false;
    }
  }
  return false;
}

function applyReplacements(content) {
  let next = content;
  for (const rule of replacements) {
    next = next.replace(rule.from, rule.to);
  }
  return next;
}

function main() {
  const files = gitLsFiles().filter(isTextFile);
  let changed = 0;
  let skipped = 0;

  for (const file of files) {
    let source;
    try {
      source = fs.readFileSync(file, 'utf8');
    } catch {
      skipped += 1;
      continue;
    }
    const next = applyReplacements(source);
    if (next === source) continue;
    fs.writeFileSync(file, next, 'utf8');
    changed += 1;
  }

  console.log(`[sanitize-personal-identifiers] changed=${changed} skipped=${skipped} scanned=${files.length}`);
}

main();
