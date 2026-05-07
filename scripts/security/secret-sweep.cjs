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
  '.py',
  '.go',
  '.toml',
  '.ini',
  '.html',
  '.xml',
  '.patch',
  '.d',
]);

const contentScanScopePatterns = [
  /^apps\//i,
  /^packages\//i,
  /^scripts\//i,
  /^docs\//i,
  /^supabase\//i,
  /^data\//i,
  /^archive\//i,
  /^\.env/i,
];

const placeholderWords = [
  'your',
  'example',
  'changeme',
  'replace',
  'placeholder',
  'sample',
  'dummy',
  'fake',
  'redacted',
  'username',
  'password',
  'token',
  'key_here',
  'open(',
  'openssl',
  'development_secret_only',
  'very-long-secret-key',
];

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 128,
    ...options,
  }).trim();
}

function runGit(gitArgs) {
  return execFileSync('git', gitArgs, {
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

function shouldScanFileContent(filePath) {
  const lower = filePath.toLowerCase();
  if (!contentScanScopePatterns.some((pattern) => pattern.test(lower))) return false;
  const ext = path.extname(lower);
  if (textFileExtensions.has(ext) || path.basename(lower).startsWith('.env')) return true;
  if (!ext) return true;
  return false;
}

function isTestPath(filePath) {
  const lower = filePath.toLowerCase();
  return (
    lower.includes('/test/') ||
    lower.includes('/tests/') ||
    lower.includes('/__tests__/') ||
    lower.includes('.test.') ||
    lower.includes('.spec.')
  );
}

function looksBinaryBuffer(buf) {
  const sample = buf.subarray(0, 4096);
  for (let i = 0; i < sample.length; i += 1) {
    if (sample[i] === 0) return true;
  }
  return false;
}

function readContentForMode(filePath, activeMode) {
  try {
    if (activeMode === 'staged') {
      return runGit(['show', `:${filePath}`]);
    }
    if (activeMode === 'pre-push') {
      return runGit(['show', `HEAD:${filePath}`]);
    }
    const buf = fs.readFileSync(filePath);
    if (looksBinaryBuffer(buf)) return '';
    return buf.toString('utf8');
  } catch {
    return '';
  }
}

function isPlaceholder(value) {
  if (!value) return true;
  const lower = String(value).toLowerCase();
  if (
    lower.includes('<') ||
    lower.includes('>') ||
    lower.includes('${') ||
    lower.includes('***')
  ) {
    return true;
  }
  return placeholderWords.some((word) => lower.includes(word));
}

function isLocalHost(hostname) {
  if (!hostname) return true;
  const lower = hostname.toLowerCase();
  return (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  );
}

function isDocLikePath(filePath) {
  const lower = filePath.toLowerCase();
  return lower.endsWith('.md') || lower.endsWith('.txt');
}

function isPlaceholderCredential(username, password, hostname) {
  const u = String(username || '').toLowerCase();
  const p = String(password || '').toLowerCase();
  const h = String(hostname || '').toLowerCase();
  const placeholderUsers = new Set([
    'user',
    'username',
    'postgres',
    'test',
    'dev',
    'prod_user',
    'staging_user',
    'default',
  ]);
  const placeholderPasswords = new Set([
    'pass',
    'password',
    'test',
    'changeme',
    'secure_password',
    'dev_password',
    'staging_password',
    'default',
    'postgres',
  ]);
  if (h.includes('example')) return true;
  if (placeholderUsers.has(u) && placeholderPasswords.has(p)) return true;
  return false;
}

function cleanUrlToken(raw) {
  return raw.replace(/[),.;]+$/g, '');
}

function redactValue(value) {
  const text = String(value);
  if (text.length <= 12) return '***';
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
}

function lineNumberFromIndex(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function lineTextFromIndex(content, index) {
  const start = content.lastIndexOf('\n', index - 1) + 1;
  const end = content.indexOf('\n', index);
  if (end === -1) return content.slice(start);
  return content.slice(start, end);
}

function isCommentLine(line) {
  const trimmed = String(line || '').trim();
  return trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('--');
}

function addViolation(issues, file, check, line, value) {
  issues.push({ file, check, line, value: redactValue(value) });
}

function scanContent(file, content, issues) {
  const testPath = isTestPath(file);
  const docLikePath = isDocLikePath(file);

  const patterns = [
    {
      name: 'google_api_key',
      regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
      shouldFlag: (value) => !testPath && !isPlaceholder(value),
    },
    {
      name: 'openai_style_api_key',
      regex: /(^|[^A-Za-z0-9_-])(sk-[A-Za-z0-9_-]{24,})(?![A-Za-z0-9_-])/g,
      valueFromMatch: (m) => m[2],
      shouldFlag: (value) =>
        !testPath && !isPlaceholder(value) && !/^sk_(live|test)_/i.test(value),
    },
    {
      name: 'stripe_secret_key',
      regex: /(^|[^A-Za-z0-9_])(sk_(?:live|test)_[A-Za-z0-9]{16,})(?![A-Za-z0-9_])/g,
      valueFromMatch: (m) => m[2],
      shouldFlag: (value) => !testPath && !isPlaceholder(value),
    },
    {
      name: 'supabase_secret_key',
      regex: /\bsb_secret_[A-Za-z0-9]{20,}\b/g,
      shouldFlag: (value) => !testPath && !isPlaceholder(value),
    },
    {
      name: 'jwt_secret_assignment',
      regex: /\b(?:JWT_SECRET|JWT_REFRESH_SECRET)\b\s*[:=]\s*["']([^"'\n]{16,})["']/g,
      valueFromMatch: (m) => m[1],
      shouldFlag: (value) => {
        if (testPath || docLikePath) return false;
        const lower = String(value).toLowerCase();
        if (isPlaceholder(value)) return false;
        if (lower.includes('smoke') || lower.includes('ci') || lower.includes('test')) return false;
        return true;
      },
    },
  ];

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      const value = pattern.valueFromMatch ? pattern.valueFromMatch(match) : match[0];
      if (!pattern.shouldFlag(value, match)) continue;
      const lineText = lineTextFromIndex(content, match.index);
      if (isCommentLine(lineText)) continue;
      const line = lineNumberFromIndex(content, match.index);
      addViolation(issues, file, pattern.name, line, value);
    }
  }

  const urlPatterns = [
    { name: 'database_url_with_password', regex: /postgres(?:ql)?:\/\/[^\s"'`<>]+/g },
    { name: 'redis_url_with_password', regex: /rediss?:\/\/[^\s"'`<>]+/g },
  ];

  for (const rule of urlPatterns) {
    if (testPath || docLikePath) continue;
    rule.regex.lastIndex = 0;
    let match;
    while ((match = rule.regex.exec(content)) !== null) {
      const raw = cleanUrlToken(match[0]);
      let parsed;
      try {
        parsed = new URL(raw);
      } catch {
        continue;
      }
      if (!parsed.password) continue;
      if (isPlaceholder(parsed.password)) continue;
      if (isPlaceholderCredential(parsed.username, parsed.password, parsed.hostname)) continue;
      if (isPlaceholder(raw)) continue;
      if (isLocalHost(parsed.hostname)) continue;
      const lineText = lineTextFromIndex(content, match.index);
      if (isCommentLine(lineText)) continue;
      const line = lineNumberFromIndex(content, match.index);
      addViolation(issues, file, rule.name, line, raw);
    }
  }
}

function main() {
  const files = getFilesForMode(mode);
  if (!files.length) {
    console.log(`[secret-sweep] OK (${mode}): no files to inspect`);
    return;
  }

  const issues = [];

  for (const file of files) {
    if (!shouldScanFileContent(file)) continue;
    const content = readContentForMode(file, mode);
    if (!content) continue;
    scanContent(file, content, issues);
  }

  if (!issues.length) {
    console.log(`[secret-sweep] OK (${mode}): no high-risk secret patterns detected`);
    return;
  }

  console.error(`[secret-sweep] BLOCKED (${mode})`);
  console.error(`High-risk secret patterns detected (${issues.length}):`);
  for (const issue of issues.slice(0, 100)) {
    console.error(`  - ${issue.file}:${issue.line} ${issue.check} (${issue.value})`);
  }
  if (issues.length > 100) {
    console.error(`  ... and ${issues.length - 100} more`);
  }
  process.exit(1);
}

main();
