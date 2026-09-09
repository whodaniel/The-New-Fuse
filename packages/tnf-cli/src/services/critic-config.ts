import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { stripJsoncComments } from '../utils/jsonc.js';

export type CriticDestination =
  | { type: 'prompt' }
  | { type: 'terminal' }
  | { type: 'federated'; channel: string; relayUrl?: string; tokenEnv?: string }
  | { type: 'file'; path: string }
  | { type: 'webhook'; url: string; tokenEnv?: string };

export interface CriticConfig {
  enabled: boolean;
  provider: string;
  model: string;
  destination: CriticDestination;
  maxInputChars: number;
  maxOutputTokens: number;
  timeoutMs: number;
  maxReports: number;
}

export const DEFAULT_CRITIC_CONFIG: CriticConfig = {
  enabled: true,
  provider: 'google',
  model: 'gemini-2.5-flash-lite',
  destination: { type: 'prompt' },
  maxInputChars: 24000,
  maxOutputTokens: 800,
  timeoutMs: 15000,
  maxReports: 200,
};

function text(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) {
    throw new Error(`critic.${name} must be a nonempty string (at most 2048 characters)`);
  }
}

export function resolveCriticConfig(value: unknown = {}): CriticConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('critic settings must be an object');
  }
  for (const key of Object.keys(value)) {
    if (!(key in DEFAULT_CRITIC_CONFIG)) throw new Error(`Unknown critic setting: ${key}`);
  }
  const c = { ...DEFAULT_CRITIC_CONFIG, ...value } as CriticConfig;
  if (typeof c.enabled !== 'boolean') throw new Error('critic.enabled must be boolean');
  text(c.provider, 'provider');
  text(c.model, 'model');
  for (const [key, min, max] of [
    ['maxInputChars', 1000, 100000],
    ['maxOutputTokens', 128, 4096],
    ['timeoutMs', 1000, 60000],
    ['maxReports', 1, 1000],
  ] as const) {
    if (!Number.isInteger(c[key]) || c[key] < min || c[key] > max) {
      throw new Error(`critic.${key} must be an integer between ${min} and ${max}`);
    }
  }
  const d = c.destination;
  if (!d || typeof d !== 'object' || Array.isArray(d))
    throw new Error('critic.destination must be an object');
  const allowed: Record<string, string[]> = {
    prompt: ['type'],
    terminal: ['type'],
    federated: ['type', 'channel', 'relayUrl', 'tokenEnv'],
    file: ['type', 'path'],
    webhook: ['type', 'url', 'tokenEnv'],
  };
  if (!allowed[d.type])
    throw new Error(
      'critic.destination.type must be prompt, terminal, federated, file, or webhook'
    );
  for (const key of Object.keys(d))
    if (!allowed[d.type].includes(key))
      throw new Error(`Unknown critic destination setting: ${key}`);
  if (d.type === 'file') {
    text(d.path, 'destination.path');
    if (!path.isAbsolute(d.path)) throw new Error('critic file path must be absolute');
  }
  if (d.type === 'federated') {
    text(d.channel, 'destination.channel');
    if (d.tokenEnv !== undefined && !/^[A-Z_][A-Z0-9_]*$/.test(d.tokenEnv))
      throw new Error('critic federation tokenEnv must name an environment variable');
    if (d.relayUrl !== undefined) {
      const u = new URL(d.relayUrl);
      if (!['ws:', 'wss:'].includes(u.protocol) || u.username || u.password)
        throw new Error('critic relayUrl must be ws/wss without embedded credentials');
    }
  }
  if (d.type === 'webhook') {
    text(d.url, 'destination.url');
    const u = new URL(d.url);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password)
      throw new Error('critic webhook must be http/https without embedded credentials');
    if (d.tokenEnv !== undefined && !/^[A-Z_][A-Z0-9_]*$/.test(d.tokenEnv))
      throw new Error('critic webhook tokenEnv must name an environment variable');
  }
  return c;
}

/** User settings only. An artifact/project must not redirect critiques to another endpoint. */
export function criticConfigPath(): string {
  if (process.env.TNF_CRITIC_CONFIG_PATH) return process.env.TNF_CRITIC_CONFIG_PATH;
  const dir = path.join(os.homedir(), '.config', 'tnf');
  const jsonc = path.join(dir, 'tnf.jsonc');
  return fs.existsSync(jsonc) ? jsonc : path.join(dir, 'config.json');
}

export function loadCriticConfig(): CriticConfig {
  if (process.env.TNF_CRITIC_DISABLED === '1') return { ...DEFAULT_CRITIC_CONFIG, enabled: false };
  const file = criticConfigPath();
  const doc = fs.existsSync(file)
    ? JSON.parse(stripJsoncComments(fs.readFileSync(file, 'utf8')))
    : {};
  // Invalid user settings never cause an unexpected paid call or route fallback.
  return resolveCriticConfig(doc.critic ?? {});
}
