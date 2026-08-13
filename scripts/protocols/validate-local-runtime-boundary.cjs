#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

const scanRoots = [
  '.agent/SYSTEM_PROMPT.md',
  '.agent/HANDOFF_PROMPT.md',
  '.agent/MULTI_TAB_FEDERATION_DOCUMENTATION.md',
  '.agent/context',
  '.agent/workflows',
  'docs/TNF_SESSION_ONBOARDING.md',
  'docs/PORT_MANAGEMENT.md',
  'docs/core/AGENTS.md',
  'docs/guides',
  'docs/reference',
  'docs/protocols/TURN_ZERO_MANDATE.md',
  'docs/protocols/LIVING_STATE.md',
  'scripts/tnf-onboard.cjs',
  'scripts/tnf-ports.cjs',
  'scripts/development',
  'scripts/orchestrator',
  'scripts/protocols',
  'packages/tnf-cli',
  'packages/port-management',
  'README.md',
  '.env.example',
  '.dockerignore',
  'Dockerfile.cleanroom',
];

const ignoredPathParts = new Set([
  '.git',
  '.pnpm-store',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'archive',
  '_archive',
  '_archives',
  'external',
  'runtime-logs',
  'runtime-state',
  'session-logs',
  'test-reports',
  'test_runs',
]);

const textExtensions = new Set([
  '',
  '.cjs',
  '.cts',
  '.env',
  '.example',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.sh',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

const forbiddenPatterns = [
  {
    name: 'personal absolute path',
    pattern: /\/Users\/danielgoldberg\b|~\/Desktop\/A1-Inter-LLM-Com\b/g,
    guidance: 'Move personal paths into .tnf.local.env or use repo-relative paths.',
  },
  {
    name: 'fixed legacy relay websocket',
    pattern: /ws:\/\/localhost:3001\/ws/g,
    guidance: 'Use TNF_RELAY_URL -> RELAY_WS_URL -> RELAY_URL with a documented local default.',
  },
];

function shouldSkip(relPath) {
  return relPath.split(path.sep).some((part) => ignoredPathParts.has(part));
}

function isTextFile(filePath) {
  if (path.basename(filePath).startsWith('.env')) return true;
  return textExtensions.has(path.extname(filePath));
}

function walk(target, files = []) {
  const relPath = path.relative(repoRoot, target);
  if (shouldSkip(relPath)) return files;
  if (!fs.existsSync(target)) return files;

  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      walk(path.join(target, entry), files);
    }
    return files;
  }

  if (stat.isFile() && isTextFile(target)) files.push(target);
  return files;
}

function lineForOffset(content, offset) {
  return content.slice(0, offset).split(/\r?\n/).length;
}

const findings = [];
for (const root of scanRoots) {
  for (const filePath of walk(path.join(repoRoot, root))) {
    const relPath = path.relative(repoRoot, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    for (const rule of forbiddenPatterns) {
      for (const match of content.matchAll(rule.pattern)) {
        findings.push({
          file: relPath,
          line: lineForOffset(content, match.index || 0),
          rule: rule.name,
          value: match[0],
          guidance: rule.guidance,
        });
      }
    }
  }
}

if (findings.length > 0) {
  console.error('[local-runtime-boundary] FAILED');
  console.table(findings);
  process.exit(1);
}

console.log('[local-runtime-boundary] OK: no forbidden personal paths or fixed legacy relay literals found');
