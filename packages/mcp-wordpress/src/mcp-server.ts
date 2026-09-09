/**
 * Optional MCP server entry — requires @the-new-fuse/mcp-core at runtime.
 *
 * Credential ownership (fail closed):
 * WordPress is a personal spoke; tool calls must be attributed to an
 * authenticated TNF account owner. Machine-global env vars alone are never
 * the silent default. Resolution order:
 *
 *   1. TNF_WP_CREDENTIALS_PATH — explicit per-user credentials file
 *      (JSON: { siteUrl, username, appPassword }, mode 0600).
 *   2. Account-bound vault path: ~/.tnf/vault/<ownerUserId>/wordpress.credentials.json
 *      where ownerUserId comes from TNF_OWNER_USER_ID or the binding written by
 *      `tnf library bind` (~/.tnf/account-binding.json, fallback
 *      ~/.tnf/vault/active-account.json).
 *   3. Hub-saved tenant credentials (apps/api wordpress.credentials pattern):
 *      <cloud-durable-root>/<safe ownerUserId>/wordpress.json with an
 *      AES-256-GCM `appPasswordEnc` v1 envelope keyed by
 *      TNF_WP_SECRET_KEY || TNF_BYOC_SECRET_KEY || JWT_SECRET.
 *   4. Legacy global env (TNF_WP_SITE_URL/WP_URL, TNF_WP_USERNAME/WP_USER,
 *      TNF_WP_APP_PASSWORD/WP_APP_PASSWORD) — single-user dogfood only;
 *      requires explicit TNF_WP_ALLOW_GLOBAL_ENV=1 so env-only ownership is
 *      never silent on shared machines.
 */
import { MCPServer } from '@the-new-fuse/mcp-core';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { WordpressCredentials } from './client';
import { executeWordpressTool, wordpressTools } from './tools';

interface CredentialsFile {
  siteUrl?: string;
  username?: string;
  appPassword?: string;
  /** Hub/API envelope (apps/api wordpress.credentials.ts), decrypted below. */
  appPasswordEnc?: string;
}

function tnfHome(): string {
  return process.env.TNF_HOME || path.join(os.homedir(), '.tnf');
}

function readOwnerUserIdFromJson(filePath: string): string {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { ownerUserId?: string };
    return String(raw.ownerUserId || '').trim();
  } catch {
    return '';
  }
}

function resolveOwnerUserId(): string {
  const explicit = (process.env.TNF_OWNER_USER_ID || '').trim();
  if (explicit) return explicit;
  const home = tnfHome();
  return (
    readOwnerUserIdFromJson(path.join(home, 'account-binding.json')) ||
    readOwnerUserIdFromJson(path.join(home, 'vault', 'active-account.json'))
  );
}

/**
 * Mirrors apps/api/src/modules/wordpress/wordpress.credentials.ts secretKey()
 * so credentials saved through the hub API decrypt here unchanged.
 */
function hubSecretKey(): Buffer {
  const raw =
    process.env.TNF_WP_SECRET_KEY ||
    process.env.TNF_BYOC_SECRET_KEY ||
    process.env.JWT_SECRET ||
    'tnf-wp-dev-only-change-me';
  return crypto.createHash('sha256').update(raw).digest();
}

function decryptHubSecret(blob: string): string {
  const [ver, ivB64, tagB64, dataB64] = String(blob).split(':');
  if (ver !== 'v1' || !ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid WP secret envelope');
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    hubSecretKey(),
    Buffer.from(ivB64, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function loadCredentialsFile(filePath: string): WordpressCredentials | null {
  let raw: CredentialsFile;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as CredentialsFile;
  } catch {
    return null;
  }
  const siteUrl = String(raw.siteUrl || '').trim();
  const username = String(raw.username || '').trim();
  if (!siteUrl || !username) return null;
  let appPassword = '';
  try {
    appPassword = raw.appPasswordEnc
      ? decryptHubSecret(raw.appPasswordEnc)
      : String(raw.appPassword || '');
  } catch {
    // Undecryptable (wrong/missing key or corrupt envelope): treat the file as
    // absent so resolution falls through and ends in the fail-closed guidance
    // instead of leaking a crypto error without ownership context.
    return null;
  }
  if (!appPassword) return null;
  return { siteUrl: siteUrl.replace(/\/$/, ''), username, appPassword };
}

/** Per-user path where the hub API (writeWordpressConfig) persists tenant creds. */
function hubCredentialsPath(ownerUserId: string): string {
  const cloudRoot =
    process.env.TNF_DURABLE_CLOUD_ROOT || path.join(tnfHome(), 'cloud-durable-tasks');
  const safe = ownerUserId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'anonymous';
  return path.join(cloudRoot, safe, 'wordpress.json');
}

function envCreds(): WordpressCredentials | null {
  const siteUrl = process.env.TNF_WP_SITE_URL || process.env.WP_URL || '';
  const username = process.env.TNF_WP_USERNAME || process.env.WP_USER || '';
  const appPassword = process.env.TNF_WP_APP_PASSWORD || process.env.WP_APP_PASSWORD || '';
  if (!siteUrl || !username || !appPassword) return null;
  return { siteUrl, username, appPassword };
}

function failClosedCredentialsError(detail?: string): Error {
  return new Error(
    'WordPress MCP credentials are not bound to a TNF account owner (fail closed). Fix one of: ' +
      '(1) set TNF_WP_CREDENTIALS_PATH to a per-user credentials JSON ' +
      '{ siteUrl, username, appPassword } (mode 0600); ' +
      '(2) run `tnf library bind` and store credentials at ' +
      '~/.tnf/vault/<ownerUserId>/wordpress.credentials.json; ' +
      '(3) save tenant credentials through the hub API (wordpress.credentials) — read from ' +
      '<cloud-durable-root>/<ownerUserId>/wordpress.json; ' +
      '(4) legacy single-user dogfood only: set TNF_WP_SITE_URL/TNF_WP_USERNAME/TNF_WP_APP_PASSWORD ' +
      'and export TNF_WP_ALLOW_GLOBAL_ENV=1.' +
      (detail ? ` Underlying issue: ${detail}` : '')
  );
}

function resolveWordpressCredentials(): WordpressCredentials {
  // 1. Explicit per-user credentials file.
  const explicitPath = (process.env.TNF_WP_CREDENTIALS_PATH || '').trim();
  if (explicitPath) {
    const creds = loadCredentialsFile(explicitPath);
    if (creds) return creds;
    throw failClosedCredentialsError(
      `TNF_WP_CREDENTIALS_PATH is set but unreadable/incomplete: ${explicitPath}`
    );
  }

  // 2/3. Account-bound per-user credentials (vault file, then hub-saved file).
  const ownerUserId = resolveOwnerUserId();
  if (ownerUserId) {
    const vaultFile = path.join(tnfHome(), 'vault', ownerUserId, 'wordpress.credentials.json');
    const fromVault = loadCredentialsFile(vaultFile);
    if (fromVault) return fromVault;
    const hubFile = hubCredentialsPath(ownerUserId);
    if (fs.existsSync(hubFile)) {
      const fromHub = loadCredentialsFile(hubFile);
      if (fromHub) return fromHub;
    }
  }

  // 4. Legacy global env — gated so env-only ownership is never silent.
  const env = envCreds();
  if (env) {
    if (process.env.TNF_WP_ALLOW_GLOBAL_ENV === '1') {
      console.warn(
        '[TNF-WP-MCP] Using legacy global-env WordPress credentials (TNF_WP_ALLOW_GLOBAL_ENV=1). ' +
          'Prefer a per-user credentials path: TNF_WP_CREDENTIALS_PATH or ' +
          '~/.tnf/vault/<ownerUserId>/wordpress.credentials.json.'
      );
      return env;
    }
    throw failClosedCredentialsError(
      'global env credentials are present but TNF_WP_ALLOW_GLOBAL_ENV=1 is not set'
    );
  }

  throw failClosedCredentialsError();
}

export function createWordpressMcpServer(): MCPServer {
  const server = new MCPServer();
  for (const tool of wordpressTools) {
    server.registerTool({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as any,
      handler: {
        execute: async (args: any) => {
          try {
            const result = await executeWordpressTool(
              resolveWordpressCredentials(),
              tool.name,
              args || {}
            );
            return {
              success: true,
              result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] },
            };
          } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
          }
        },
      },
    });
  }
  return server;
}

if (require.main === module) {
  createWordpressMcpServer();
  console.log(`[TNF-WP-MCP] Registered tools: ${wordpressTools.map((t) => t.name).join(', ')}`);
}
