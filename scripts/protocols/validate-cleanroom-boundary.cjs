#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const dockerfilePath = path.join(repoRoot, 'Dockerfile.cleanroom');
const dockerignorePath = path.join(repoRoot, '.dockerignore');

let failed = false;

function fail(message) {
  failed = true;
  console.error(`FAIL: ${message}`);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing ${path.relative(repoRoot, filePath)}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function requireIncludes(content, needle, label) {
  if (!content.includes(needle)) fail(`${label} missing required marker: ${needle}`);
  else pass(`${label} includes ${needle}`);
}

function requireExcludes(content, pattern, label, message) {
  if (pattern.test(content)) fail(`${label} ${message}`);
  else pass(`${label} excludes ${message}`);
}

const dockerfile = readRequired(dockerfilePath);
const dockerignore = readRequired(dockerignorePath);

if (dockerfile) {
  requireIncludes(dockerfile, 'ENV TNF_ROOT=/home/tnfuser/Projects/The-New-Fuse', 'Dockerfile.cleanroom');
  requireIncludes(dockerfile, 'ENV TNF_RELAY_URL=ws://127.0.0.1:3000/ws', 'Dockerfile.cleanroom');
  requireIncludes(dockerfile, 'WORKDIR $TNF_ROOT', 'Dockerfile.cleanroom');
  requireIncludes(dockerfile, 'validate-local-runtime-boundary.cjs', 'Dockerfile.cleanroom');
  requireExcludes(
    dockerfile,
    /\/Users\/danielgoldberg\b|~\/Desktop\/A1-Inter-LLM-Com\b|ws:\/\/localhost:3001(?:\/ws)?/,
    'Dockerfile.cleanroom',
    'personal paths and fixed legacy relay literals'
  );
}

if (dockerignore) {
  const requiredPatterns = [
    '.env',
    '.env.*',
    '!.env.example',
    '!.env.*.example',
    '.tnf.local.env',
    '.tnf.local.env.*',
    '**/.env',
    '**/.env.*',
    '!**/.env.example',
    '!**/.env.*.example',
    '.pnpm-store',
    '**/.pnpm-store',
    'node_modules',
    '**/node_modules',
  ];

  for (const pattern of requiredPatterns) {
    requireIncludes(dockerignore, pattern, '.dockerignore');
  }
}

if (failed) {
  console.error('[cleanroom-boundary] FAILED');
  process.exit(1);
}

console.log('[cleanroom-boundary] OK: clean-room Docker boundary is portable and local-secret safe');
