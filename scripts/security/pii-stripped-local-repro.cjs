#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const ROOT = process.cwd();

function readArg(name, fallback = '') {
  const exact = args.indexOf(`--${name}`);
  if (exact !== -1) {
    const next = args[exact + 1];
    if (!next) throw new Error(`Missing value for --${name}`);
    return next;
  }
  const prefixed = args.find((arg) => arg.startsWith(`--${name}=`));
  return prefixed ? prefixed.slice(name.length + 3) : fallback;
}

const fileListPath = readArg('file-list');
const outPath = readArg('out', 'data/security/pii-stripped-local-repro.json');
const maxBytes = Number.parseInt(readArg('max-bytes', '200000'), 10);

if (!fileListPath) {
  throw new Error('--file-list is required; pass an explicit newline-delimited file list');
}
if (!Number.isFinite(maxBytes) || maxBytes < 1024 || maxBytes > 5_000_000) {
  throw new Error('--max-bytes must be an integer between 1024 and 5000000');
}

const redactors = [
  { label: 'email', regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, value: '[REDACTED_EMAIL]' },
  { label: 'phone', regex: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, value: '[REDACTED_PHONE]' },
  { label: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g, value: '[REDACTED_SSN]' },
  { label: 'bearer_token', regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/g, value: 'Bearer [REDACTED_TOKEN]' },
  {
    label: 'credential_assignment',
    regex:
      /\b(?:access[_-]?token|refresh[_-]?token|api[_-]?key|client[_-]?secret|secret[_-]?key|password|passphrase)\b\s*[:=]\s*["']?[^"'\s,;]+/gi,
    value: '[REDACTED_CREDENTIAL_ASSIGNMENT]',
  },
  { label: 'home_path', regex: /\/Users\/[^/\s]+/g, value: '/Users/[REDACTED_USER]' },
];

function isSafeRelativePath(filePath) {
  if (!filePath || filePath.includes('\0')) return false;
  if (path.isAbsolute(filePath)) return false;
  const normalized = path.normalize(filePath);
  return !normalized.startsWith('..') && normalized !== '..';
}

function looksBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  return sample.includes(0);
}

function redact(text) {
  let redacted = text;
  const counts = {};
  for (const redactor of redactors) {
    let count = 0;
    redacted = redacted.replace(redactor.regex, () => {
      count += 1;
      return redactor.value;
    });
    if (count) counts[redactor.label] = count;
  }
  return {
    text: redacted,
    counts,
    redactionCount: Object.values(counts).reduce((sum, value) => sum + value, 0),
  };
}

const fileList = fs
  .readFileSync(fileListPath, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const entries = [];
const skipped = [];

for (const relPath of fileList) {
  if (!isSafeRelativePath(relPath)) {
    skipped.push({ file: relPath, reason: 'unsafe-path' });
    continue;
  }

  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) {
    skipped.push({ file: relPath, reason: 'missing' });
    continue;
  }

  const buffer = fs.readFileSync(absPath);
  if (looksBinary(buffer)) {
    skipped.push({ file: relPath, reason: 'binary' });
    continue;
  }

  const truncated = buffer.length > maxBytes;
  const raw = buffer.subarray(0, Math.min(buffer.length, maxBytes)).toString('utf8');
  const result = redact(raw);
  entries.push({
    file: relPath,
    bytesRead: Math.min(buffer.length, maxBytes),
    truncated,
    redactionCount: result.redactionCount,
    redactions: result.counts,
    content: result.text,
  });
}

const payload = {
  generatedAt: new Date().toISOString(),
  sourceFileList: fileListPath,
  maxBytes,
  entries,
  skipped,
  summary: {
    requested: fileList.length,
    included: entries.length,
    skipped: skipped.length,
    redactions: entries.reduce((sum, entry) => sum + entry.redactionCount, 0),
  },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `[pii-stripped-local-repro] wrote ${outPath} (${payload.summary.included} files, ${payload.summary.redactions} redactions)`
);
