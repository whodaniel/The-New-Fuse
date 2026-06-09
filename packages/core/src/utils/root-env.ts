import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse, resolve } from 'node:path';

let loaded = false;

export function loadRootEnv(startDir: string = process.cwd()): void {
  if (loaded) return;
  loaded = true;

  const envPath = findUp('.env', startDir);
  if (!envPath) return;

  const contents = readFileSync(envPath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = unquote(trimmed.slice(eq + 1).trim());
    if (!key || process.env[key] != null) continue;
    process.env[key] = value;
  }
}

function findUp(fileName: string, startDir: string): string | null {
  let current = resolve(startDir);
  const root = parse(current).root;

  while (true) {
    const candidate = join(current, fileName);
    if (existsSync(candidate)) return candidate;
    if (current === root) return null;
    current = dirname(current);
  }
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
