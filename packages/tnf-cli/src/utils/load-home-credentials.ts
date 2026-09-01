import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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

/** Machine-local provider keys. Never override process.env. Never commit. */
export const HOME_CREDENTIAL_FILES = [
  path.join(os.homedir(), '.tnf', 'credentials.env'),
  path.join(os.homedir(), '.config', 'tnf', 'credentials.env'),
];

/**
 * First-wins load of ~/.tnf/credentials.env into process.env.
 * Existing keys (shell, repo .env) are left untouched so NVIDIA stays put.
 */
export function loadHomeCredentials(): void {
  for (const envPath of HOME_CREDENTIAL_FILES) {
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
