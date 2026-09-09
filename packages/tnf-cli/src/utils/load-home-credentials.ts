import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { tryAccountScopedPath } from '../services/AccountBindingService.js';

function parseEnvValue(rawValue: string): string {
  const value = rawValue.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Legacy flat credential files. Kept as a READ fallback for machines without
 * an authenticated TNF account; never the preferred location for new writes —
 * credentials are owned by the account, so new files belong under
 * ~/.tnf/accounts/<ownerUserId>/.
 */
export const HOME_CREDENTIAL_FILES = [
  path.join(os.homedir(), '.tnf', 'credentials.env'),
  path.join(os.homedir(), '.config', 'tnf', 'credentials.env'),
];

/**
 * Credential files in precedence order. The authenticated account's scoped
 * file (~/.tnf/accounts/<ownerUserId>/credentials.env) wins when an account is
 * bound; legacy flat paths remain as a backward-compatible read fallback.
 */
export function resolveHomeCredentialFiles(): string[] {
  const scoped = tryAccountScopedPath('credentials.env');
  if (!scoped) return [...HOME_CREDENTIAL_FILES];
  return [scoped, ...HOME_CREDENTIAL_FILES.filter((p) => p !== scoped)];
}

/**
 * First-wins load of ~/.tnf/credentials.env into process.env.
 * Existing keys (shell, repo .env) are left untouched so NVIDIA stays put.
 * Account-scoped credentials take precedence over legacy flat files; this
 * loader is read-only and never fails when no account is bound.
 */
export function loadHomeCredentials(): void {
  for (const envPath of resolveHomeCredentialFiles()) {
    if (!fs.existsSync(envPath)) continue;
    for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const normalizedLine = line.startsWith('export ')
        ? line.slice('export '.length).trim()
        : line;
      const separatorIndex = normalizedLine.indexOf('=');
      if (separatorIndex <= 0) continue;
      const key = normalizedLine.slice(0, separatorIndex).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key]) continue;
      process.env[key] = parseEnvValue(normalizedLine.slice(separatorIndex + 1));
    }
  }
}
