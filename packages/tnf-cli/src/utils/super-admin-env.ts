/**
 * Structural Super Admin token rotation helpers.
 *
 * Do not construct RegExp from secret material. Identify env assignments by
 * exact key name and replace only the value on that line.
 */

import * as fs from 'fs';
import { writeFileAtomic } from './safe-fs.js';

export type EnvWriteFn = (filePath: string, body: string) => void;
export type EnvReadFn = (filePath: string, encoding: BufferEncoding) => string;

function isEnvCommentOrBlank(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.length === 0 || trimmed.startsWith('#');
}

/**
 * Locate `KEY=value` / `export KEY=value` by structural prefix match (not by
 * scanning for the secret value). Returns null when the line is not an
 * assignment for `key`.
 */
export function parseEnvAssignmentLine(
  line: string,
  key: string
): { prefix: string; separator: string; rawValue: string } | null {
  if (isEnvCommentOrBlank(line)) return null;

  let index = 0;
  while (index < line.length && (line[index] === ' ' || line[index] === '\t')) {
    index += 1;
  }
  const indent = line.slice(0, index);

  let exportPrefix = '';
  if (line.startsWith('export', index)) {
    const afterExport = index + 'export'.length;
    if (afterExport < line.length && (line[afterExport] === ' ' || line[afterExport] === '\t')) {
      let cursor = afterExport;
      while (cursor < line.length && (line[cursor] === ' ' || line[cursor] === '\t')) {
        cursor += 1;
      }
      exportPrefix = line.slice(index, cursor);
      index = cursor;
    }
  }

  if (!line.startsWith(key, index)) return null;
  const afterKey = index + key.length;
  // Reject longer keys that share a prefix (e.g. TNF_SUPER_ADMIN_TOKEN_BACKUP).
  if (afterKey < line.length) {
    const next = line[afterKey];
    if (next !== '=' && next !== ' ' && next !== '\t') return null;
  } else {
    return null;
  }

  let sepStart = afterKey;
  while (sepStart < line.length && (line[sepStart] === ' ' || line[sepStart] === '\t')) {
    sepStart += 1;
  }
  if (line[sepStart] !== '=') return null;
  let sepEnd = sepStart + 1;
  while (sepEnd < line.length && (line[sepEnd] === ' ' || line[sepEnd] === '\t')) {
    sepEnd += 1;
  }

  return {
    prefix: `${indent}${exportPrefix}`,
    separator: line.slice(afterKey, sepEnd),
    rawValue: line.slice(sepEnd),
  };
}

function formatEnvValue(rawPrevious: string | undefined, value: string): string {
  const previous = rawPrevious?.trim() ?? '';
  const wasDoubleQuoted = previous.startsWith('"') && previous.endsWith('"') && previous.length >= 2;
  const wasSingleQuoted = previous.startsWith("'") && previous.endsWith("'") && previous.length >= 2;
  if (wasDoubleQuoted) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  if (wasSingleQuoted) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
  }
  return value;
}

/**
 * Upsert a single env assignment. Only the matching key's value is changed;
 * other lines (including ones that happen to contain the old secret as text)
 * are left untouched.
 */
export function upsertEnvAssignment(content: string, key: string, value: string): string {
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  const endsWithNewline = content.length > 0 && /[\r\n]$/.test(content);
  const lines = content.length === 0 ? [] : content.split(/\r?\n/);
  let found = false;

  const nextLines = lines.map((line) => {
    const parsed = parseEnvAssignmentLine(line, key);
    if (!parsed) return line;
    found = true;
    return `${parsed.prefix}${key}${parsed.separator}${formatEnvValue(parsed.rawValue, value)}`;
  });

  if (!found) {
    if (nextLines.length > 0 && nextLines[nextLines.length - 1] === '') {
      nextLines[nextLines.length - 1] = `${key}=${formatEnvValue(undefined, value)}`;
      nextLines.push('');
    } else {
      nextLines.push(`${key}=${formatEnvValue(undefined, value)}`);
    }
  }

  let result = nextLines.join(newline);
  if (endsWithNewline && !/[\r\n]$/.test(result)) {
    result += newline;
  }
  return result;
}

export type PersistSuperAdminTokenRotationOptions = {
  envPath: string;
  /** Keys whose values should be set to the new token (master + input). */
  keys: readonly string[];
  newToken: string;
  writeFile?: EnvWriteFn;
  readFile?: EnvReadFn;
  existsSync?: (filePath: string) => boolean;
};

/**
 * Persist a Super Admin token rotation to `.env` by structural key upsert.
 * Throws before the caller should mutate process.env when the write fails.
 */
export function persistSuperAdminTokenRotation(
  options: PersistSuperAdminTokenRotationOptions
): void {
  const {
    envPath,
    keys,
    newToken,
    writeFile = writeFileAtomic,
    readFile = (filePath, encoding) => fs.readFileSync(filePath, encoding),
    existsSync = (filePath) => fs.existsSync(filePath),
  } = options;

  if (!newToken || typeof newToken !== 'string') {
    throw new Error('Super Admin token rotation aborted: empty token.');
  }
  if (keys.length === 0) {
    throw new Error('Super Admin token rotation aborted: no env keys provided.');
  }

  let content = '';
  if (existsSync(envPath)) {
    content = readFile(envPath, 'utf8');
  }

  for (const key of keys) {
    content = upsertEnvAssignment(content, key, newToken);
  }

  writeFile(envPath, content);
}
