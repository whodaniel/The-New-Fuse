#!/usr/bin/env node
/* eslint-disable no-console */
const { execFileSync, execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith('--mode=')) || '--mode=staged';
const mode = modeArg.split('=')[1] || 'staged';

const textFileExtensions = new Set([
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
  '.sh',
  '.sql',
  '.csv',
]);

const blockedPathPatterns = [
  // Public agent definitions and skill cards under `.agent/fleet` are intended to be versioned.
  // Block only private/runtime slices of `.agent`.
  /^\.agent\/(?:runtime-logs|runtime-state|private|secrets?|state-snapshots)\//i,
  /^data\/private\//i,
  /^data\/protocols\/.*\.(json|jsonl)$/i,
  /^data\/unified-task-ledger\.json$/i,
  /^data\/unified-task-ledger\.json\.bak-/i,
  /^data\/protocols\/email-.*\.json$/i,
  /^data\/protocols\/manual-fact-intake\..*\.json$/i,
  /^data\/wiki-inbox\//i,
  /^data\/mcp\.clients\//i,
  /^data\/mcp_config\.json$/i,
  /^data\/agent-registry\/agent-cards\.json$/i,
  /^docs\/library\/README\.md$/i,
  /^docs\/library\/REGISTRY\.md$/i,
  /^docs\/library\/.*\.md$/i,
  /^docs\/library\/EMAIL_.*\.md$/i,
  /^reports\/personal-archaeology\//i,
  /^apps\/api\/data\/unified-task-ledger\.json$/i,
  /^scripts\/cloud_runtime\/openclaw-codex-tenants\.json$/i,
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPersonalEmailRegex() {
  const raw = process.env.PRIVACY_GUARD_PERSONAL_EMAILS || '';
  const tokens = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => {
      if (!value) return false;
      if (value.endsWith('@example.com')) return false;
      if (value.startsWith('owner@')) return false;
      return true;
    });
  if (!tokens.length) return null;
  const pattern = tokens.map((value) => escapeRegex(value)).join('|');
  return new RegExp(`\\b(?:${pattern})\\b`, 'gi');
}

const personalEmailRegex = buildPersonalEmailRegex();

const sensitiveContentChecks = [
  // Local machine paths in diagnostics are useful but should not hard-fail pushes.
  { name: 'owner_home_path', severity: 'warn', regex: /\/Users\/danielgoldberg\//gi },
  { name: 'mailbox_reference', severity: 'block', regex: /\.mbox\//gi },
  { name: 'raw_emlx_reference', severity: 'block', regex: /\.emlx\b/gi },
  ...(personalEmailRegex
    ? [{ name: 'personal_email_address', severity: 'block', regex: personalEmailRegex }]
    : []),
  {
    name: 'high_risk_secret_value',
    severity: 'block',
    regex:
      /\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|CLOUDFLARE_API_TOKEN|STRIPE_SECRET_KEY)\b\s*[:=]\s*["']?(?!your[_-]|YOUR[_-]|example|EXAMPLE|changeme|CHANGEME|placeholder|PLACEHOLDER|sample|SAMPLE|dummy|DUMMY|test|TEST|<|\$\{)[A-Za-z0-9._\-]{20,}/g,
  },
];

const contentScanScopePatterns = [
  /^\.agent\//i,
  /^data\//i,
  /^docs\//i,
  /^reports\//i,
  /^apps\/api\/data\//i,
];

const riskyAuthorEmailPatterns = [/@yahoo\./i, /@gmail\./i, /@outlook\./i, /@icloud\./i, /@hotmail\./i];

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
      // No upstream yet: fallback to latest commit.
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

function shouldScanFileContent(filePath) {
  const lower = filePath.toLowerCase();
  if (!contentScanScopePatterns.some((pattern) => pattern.test(lower))) return false;
  const ext = path.extname(lower);
  return textFileExtensions.has(ext) || path.basename(lower).startsWith('.env');
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

function main() {
  let authorIdentityViolation = null;
  if (mode !== 'repo') {
    try {
      const authorEmail = run('git config --get user.email');
      if (authorEmail && riskyAuthorEmailPatterns.some((pattern) => pattern.test(authorEmail))) {
        authorIdentityViolation = authorEmail;
      }
    } catch {
      // noop
    }
  }

  const files = getFilesForMode(mode);
  if (!files.length && !authorIdentityViolation) {
    console.log(`[privacy-guard] OK (${mode}): no files to inspect`);
    return;
  }

  const pathViolations = [];
  const contentViolations = [];
  const contentWarnings = [];

  for (const file of files) {
    if (blockedPathPatterns.some((pattern) => pattern.test(file))) {
      pathViolations.push(file);
    }

    if (!shouldScanFileContent(file)) continue;
    const content = readContentForMode(file, mode);
    if (!content) continue;

    const matchedViolations = [];
    const matchedWarnings = [];
    for (const check of sensitiveContentChecks) {
      check.regex.lastIndex = 0;
      if (check.regex.test(content)) {
        if (check.severity === 'warn') {
          matchedWarnings.push(check.name);
        } else {
          matchedViolations.push(check.name);
        }
      }
    }
    if (matchedWarnings.length) {
      contentWarnings.push({ file, checks: matchedWarnings });
    }
    if (matchedViolations.length) {
      contentViolations.push({ file, checks: matchedViolations });
    }
  }

  if (!pathViolations.length && !contentViolations.length && !authorIdentityViolation) {
    if (contentWarnings.length) {
      console.warn(`[privacy-guard] WARN (${mode}): non-blocking sensitive diagnostics detected`);
      for (const issue of contentWarnings.slice(0, 50)) {
        console.warn(`  - ${issue.file}: ${issue.checks.join(', ')}`);
      }
      if (contentWarnings.length > 50) {
        console.warn(`  ... and ${contentWarnings.length - 50} more`);
      }
    }
    console.log(`[privacy-guard] OK (${mode}): no blocked paths or sensitive content detected`);
    return;
  }

  console.error(`[privacy-guard] BLOCKED (${mode})`);
  if (authorIdentityViolation) {
    console.error(`Commit identity uses a personal email (${authorIdentityViolation}).`);
    console.error('Set a non-personal address, e.g. GitHub noreply, before committing/pushing.');
  }
  if (pathViolations.length) {
    console.error(`Blocked paths detected (${pathViolations.length}):`);
    for (const file of pathViolations.slice(0, 50)) {
      console.error(`  - ${file}`);
    }
    if (pathViolations.length > 50) {
      console.error(`  ... and ${pathViolations.length - 50} more`);
    }
  }
  if (contentViolations.length) {
    console.error(`Sensitive content signals detected (${contentViolations.length}):`);
    for (const issue of contentViolations.slice(0, 50)) {
      console.error(`  - ${issue.file}: ${issue.checks.join(', ')}`);
    }
    if (contentViolations.length > 50) {
      console.error(`  ... and ${contentViolations.length - 50} more`);
    }
  }
  console.error('Remove/redact these changes or move private records to authenticated database storage only.');
  process.exit(1);
}

main();
