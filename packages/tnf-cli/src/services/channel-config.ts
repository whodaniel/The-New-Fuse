/**
 * User-configurable messaging-channel registry (Slack, WhatsApp, …).
 *
 * WHY
 *   The Slack and WhatsApp services read eight environment variables hardcoded
 *   across four source files, and none of the eight appear in `.env.example`.
 *   A user running the open-source harness locally had no way to discover how
 *   to configure channels short of reading the service source — the same defect
 *   as the hardcoded `providerConfigs` array this module's sibling replaced.
 *
 * SECRETS ARE NOT STORED HERE
 *   This file declares *which environment variable* holds each credential, plus
 *   non-secret settings (enabled, webhook port, timeouts). Tokens themselves
 *   stay in the environment. Writing bot tokens into a plaintext config file
 *   under ~/.config would be a downgrade, and `credentialEnv` keeps the
 *   indirection explicit — mirroring `envKey` in provider-config.ts.
 *
 * SCOPE
 *   Local harness configuration only. It changes how *this* installation reads
 *   its own credentials and toggles; it does not touch network-wide TWIP/A2A
 *   envelope handling, federated identity, or any protocol that crosses the
 *   SaaS boundary.
 *
 * Same three rules as provider-config.ts: never fail closed, never fail
 * silently, defaults live in code so the file is an override layer.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface ChannelCredential {
  /** Logical name of the credential, e.g. "botToken". */
  key: string;
  /** Environment variable that supplies it. Never the value itself. */
  env: string;
  /** When false, the channel can start without it. */
  required: boolean;
}

export interface ChannelDef {
  id: string;
  name: string;
  enabled: boolean;
  credentials: ChannelCredential[];
  /** Non-secret settings; freely overridable in the config file. */
  settings: Record<string, string | number | boolean>;
}

export type ChannelReadiness = 'ready' | 'disabled' | 'missing-credentials';

export interface ChannelStatus {
  id: string;
  name: string;
  enabled: boolean;
  readiness: ChannelReadiness;
  /** Names of required env vars that are unset. Never their values. */
  missing: string[];
  settings: Record<string, string | number | boolean>;
}

export interface ChannelConfig {
  channels: ChannelDef[];
  source: 'defaults' | 'user' | 'user+defaults';
  configPath: string;
  warnings: string[];
}

export const DEFAULT_CHANNELS: ChannelDef[] = [
  {
    id: 'slack',
    name: 'Slack',
    enabled: true,
    credentials: [
      { key: 'botToken', env: 'TNF_SLACK_BOT_TOKEN', required: true },
      { key: 'signingSecret', env: 'TNF_SLACK_SIGNING_SECRET', required: true },
      { key: 'appToken', env: 'TNF_SLACK_APP_TOKEN', required: true },
    ],
    settings: {},
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    enabled: true,
    credentials: [
      { key: 'token', env: 'TNF_WHATSAPP_TOKEN', required: true },
      { key: 'phoneId', env: 'TNF_WHATSAPP_PHONE_ID', required: true },
      { key: 'verifyToken', env: 'TNF_WHATSAPP_VERIFY_TOKEN', required: true },
      { key: 'appSecret', env: 'TNF_WHATSAPP_APP_SECRET', required: false },
    ],
    settings: { webhookPort: 3010 },
  },
];

export function channelConfigPath(): string {
  const override = process.env.TNF_CHANNEL_CONFIG_PATH;
  if (override && override.trim()) return override.trim();
  return path.join(os.homedir(), '.config', 'tnf', 'channels.json');
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function mergeChannel(
  raw: unknown,
  index: number,
  base: Map<string, ChannelDef>,
  warnings: string[]
): ChannelDef | null {
  if (!isRecord(raw)) {
    warnings.push(`channels[${index}] is not an object — entry ignored`);
    return null;
  }
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id) {
    warnings.push(`channels[${index}] has no "id" — entry ignored`);
    return null;
  }

  const existing = base.get(id);
  let credentials = existing?.credentials ?? [];
  if (raw.credentials !== undefined) {
    if (!Array.isArray(raw.credentials)) {
      warnings.push(`channel "${id}": "credentials" must be an array — built-in credentials kept`);
    } else {
      const merged: ChannelCredential[] = [];
      raw.credentials.forEach((c, i) => {
        if (!isRecord(c) || typeof c.key !== 'string' || typeof c.env !== 'string') {
          warnings.push(
            `channel "${id}" credentials[${i}] needs string "key" and "env" — entry ignored`
          );
          return;
        }
        // A literal-looking secret in the config file is a mistake worth naming.
        if ('value' in c || 'token' in c) {
          warnings.push(
            `channel "${id}" credentials[${i}] appears to contain a literal secret — only "env" (a variable name) is read; remove it`
          );
        }
        merged.push({
          key: c.key,
          env: c.env,
          required: typeof c.required === 'boolean' ? c.required : true,
        });
      });
      if (merged.length) credentials = merged;
    }
  }

  let settings = { ...(existing?.settings ?? {}) };
  if (raw.settings !== undefined) {
    if (!isRecord(raw.settings)) {
      warnings.push(`channel "${id}": "settings" must be an object — built-in settings kept`);
    } else {
      for (const [k, v] of Object.entries(raw.settings)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
          settings[k] = v;
        else
          warnings.push(`channel "${id}" setting "${k}" must be string|number|boolean — ignored`);
      }
    }
  }

  if (!credentials.length) {
    warnings.push(
      `channel "${id}" declares no credentials and cannot be evaluated — entry ignored`
    );
    return null;
  }

  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : (existing?.name ?? id),
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : (existing?.enabled ?? true),
    credentials,
    settings,
  };
}

export function loadChannelConfig(): ChannelConfig {
  const configPath = channelConfigPath();
  const warnings: string[] = [];
  const base = new Map(DEFAULT_CHANNELS.map((c) => [c.id, { ...c }]));

  const fallback = (source: ChannelConfig['source']): ChannelConfig => ({
    channels: DEFAULT_CHANNELS.map((c) => ({ ...c })),
    source,
    configPath,
    warnings,
  });

  if (!fs.existsSync(configPath)) return fallback('defaults');

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    warnings.push(
      `${configPath} is not valid JSON (${(err as Error).message}) — built-in defaults used`
    );
    return fallback('defaults');
  }
  if (!isRecord(parsed)) {
    warnings.push(`${configPath} must contain a JSON object — built-in defaults used`);
    return fallback('defaults');
  }
  if (parsed.channels === undefined) return fallback('user+defaults');
  if (!Array.isArray(parsed.channels)) {
    warnings.push('"channels" must be an array — built-in channel list used');
    return fallback('user+defaults');
  }

  const effective = new Map(base);
  parsed.channels.forEach((raw, i) => {
    const merged = mergeChannel(raw, i, base, warnings);
    if (merged) effective.set(merged.id, merged);
  });

  return {
    channels: [...effective.values()].sort((a, b) => a.id.localeCompare(b.id)),
    source: 'user',
    configPath,
    warnings,
  };
}

/**
 * Report readiness per channel. Distinguishes disabled from unconfigured from
 * ready — a channel that simply fails to start tells the operator nothing about
 * which of the three it was.
 */
export function channelStatus(config: ChannelConfig = loadChannelConfig()): ChannelStatus[] {
  return config.channels.map((c) => {
    const missing = c.credentials
      .filter((cr) => cr.required && !process.env[cr.env])
      .map((cr) => cr.env);
    const readiness: ChannelReadiness = !c.enabled
      ? 'disabled'
      : missing.length
        ? 'missing-credentials'
        : 'ready';
    return { id: c.id, name: c.name, enabled: c.enabled, readiness, missing, settings: c.settings };
  });
}
