#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith('--mode=')) || '--mode=staged';
const mode = modeArg.split('=')[1] || 'staged';

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'icloud.com',
  'hotmail.com',
  'aol.com',
]);

const DEFAULT_BLOCKED_PHRASES = ['Daniel Adam Goldberg'];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 128,
    ...options,
  }).trim();
}

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 128,
  }).trim();
}

function getFilesForMode(activeMode) {
  const explicitFileListPath = process.env.PRIVACY_GUARD_FILE_LIST;
  if (explicitFileListPath && fs.existsSync(explicitFileListPath)) {
    const raw = fs.readFileSync(explicitFileListPath, 'utf8');
    return raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (activeMode === 'staged') {
    const out = run('git diff --cached --name-only --diff-filter=ACMR');
    return out ? out.split('\n').map((s) => s.trim()).filter(Boolean) : [];
  }

  if (activeMode === 'pre-push') {
    try {
      const out = run('git diff --name-only --diff-filter=ACMR @{u}..HEAD');
      return out ? out.split('\n').map((s) => s.trim()).filter(Boolean) : [];
    } catch {
      const out = run('git diff --name-only --diff-filter=ACMR HEAD~1..HEAD');
      return out ? out.split('\n').map((s) => s.trim()).filter(Boolean) : [];
    }
  }

  if (activeMode === 'repo') {
    const out = run('git ls-files');
    return out ? out.split('\n').map((s) => s.trim()).filter(Boolean) : [];
  }

  throw new Error(`Unsupported mode: ${activeMode}`);
}

function isDocsTextFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (!normalized.startsWith('docs/')) return false;
  const ext = path.extname(normalized).toLowerCase();
  return new Set(['.md', '.txt', '.json', '.jsonl', '.yaml', '.yml', '.sh']).has(ext);
}

function readContentForMode(filePath, activeMode) {
  try {
    if (activeMode === 'staged') {
      return runGit(['show', `:${filePath}`]);
    }
    if (activeMode === 'pre-push') {
      return runGit(['show', `HEAD:${filePath}`]);
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function parseBlockedPhrases() {
  const raw = process.env.DOCS_PII_BLOCKED_PHRASES || '';
  const tokens = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const merged = [...new Set([...DEFAULT_BLOCKED_PHRASES, ...tokens])];
  return merged.map((phrase) => ({
    phrase,
    regex: new RegExp(escapeRegex(phrase), 'i'),
  }));
}

function isPlaceholderPersonalEmail(email) {
  const [local, domain] = email.toLowerCase().split('@');
  if (!PERSONAL_EMAIL_DOMAINS.has(domain)) return true;

  if (
    local === 'your-email' ||
    local === 'your_email' ||
    local === 'youremail' ||
    local === 'example' ||
    local === 'test' ||
    local === 'user' ||
    local === 'admin' ||
    local === 'owner' ||
    local === 'support' ||
    local === 'privacy' ||
    local === 'legal' ||
    local === 'security' ||
    local === 'noreply' ||
    local === 'no-reply'
  ) {
    return true;
  }

  if (local.startsWith('your-') || local.startsWith('example-') || local.startsWith('test-')) {
    return true;
  }

  return false;
}

function scanFile(filePath, content, blockedPhrases) {
  const lines = content.split(/\r?\n/);
  const issues = [];

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];

    for (const blocked of blockedPhrases) {
      if (blocked.regex.test(line)) {
        issues.push({
          file: filePath,
          line: idx + 1,
          type: 'blocked_phrase',
          detail: blocked.phrase,
        });
      }
    }

    const emailMatches = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    for (const email of emailMatches) {
      const normalized = email.toLowerCase();
      const domain = normalized.split('@')[1] || '';
      if (!PERSONAL_EMAIL_DOMAINS.has(domain)) continue;
      if (isPlaceholderPersonalEmail(normalized)) continue;
      issues.push({
        file: filePath,
        line: idx + 1,
        type: 'personal_email_domain',
        detail: normalized,
      });
    }
  }

  return issues;
}

function main() {
  const blockedPhrases = parseBlockedPhrases();
  const files = getFilesForMode(mode).filter((file) => isDocsTextFile(file));

  if (!files.length) {
    console.log(`[docs-pii-guard] OK (${mode}): no docs files to inspect`);
    return;
  }

  const violations = [];
  for (const file of files) {
    const content = readContentForMode(file, mode);
    if (!content) continue;
    const issues = scanFile(file, content, blockedPhrases);
    violations.push(...issues);
  }

  if (!violations.length) {
    console.log(`[docs-pii-guard] OK (${mode}): no blocked owner identifiers or personal-provider emails detected in docs`);
    return;
  }

  console.error(`[docs-pii-guard] BLOCKED (${mode})`);
  console.error(`Violations detected: ${violations.length}`);
  for (const issue of violations.slice(0, 200)) {
    console.error(`  - ${issue.file}:${issue.line} [${issue.type}] ${issue.detail}`);
  }
  if (violations.length > 200) {
    console.error(`  ... and ${violations.length - 200} more`);
  }
  console.error('Redact owner-identifying terms and personal-provider emails from docs content.');
  process.exit(1);
}

main();
