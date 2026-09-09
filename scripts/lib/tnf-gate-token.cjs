'use strict';

/**
 * Shared resolution and verification for TNF_GATE_POLICY_TOKEN.
 *
 * The token was previously read straight from `process.env` by every consumer
 * that wanted it, while `synthetic-federation-gate-check.cjs` carried the only
 * real resolver (env, then the on-disk credential files). The result was that a
 * correctly provisioned box reported the token "unset" simply because the
 * checker looked in one of the two places it lives.
 *
 * Presence is also not health: a stale or revoked token is present and still
 * 401s the gate. `verifyGateToken` asks the endpoint, so callers can report
 * what is true rather than what is merely configured.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_ENDPOINT =
  process.env.TNF_GATE_POLICY_ENDPOINT || 'https://tnf-sharedstate.bizsynth.workers.dev';

/** Credential files, highest precedence first. Mirrors synthetic-federation-gate-check.cjs. */
const CREDENTIAL_PATHS = [
  path.join(os.homedir(), '.tnf', 'credentials.env'),
  path.join(os.homedir(), '.tnf.local.env'),
];

const TOKEN_KEY = 'TNF_GATE_POLICY_TOKEN';

function stripQuotes(value) {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

/** Pull TOKEN_KEY out of a `KEY=value` env file, tolerating `export ` prefixes. */
function readTokenFromEnvFile(envPath) {
  let content;
  try {
    content = fs.readFileSync(envPath, 'utf8');
  } catch {
    return '';
  }
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const normalized = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const match = normalized.match(new RegExp(`^${TOKEN_KEY}=(.*)$`));
    if (match) {
      const val = stripQuotes(match[1]);
      if (val) return val;
    }
  }
  return '';
}

/**
 * @returns {{token: string, source: string}} `source` is 'env', a credential
 *   file path, or '' when the token could not be found anywhere.
 */
function resolveGateToken(env = process.env) {
  const fromEnv = env[TOKEN_KEY];
  if (fromEnv && String(fromEnv).trim()) {
    return { token: String(fromEnv).trim(), source: 'env' };
  }
  for (const envPath of CREDENTIAL_PATHS) {
    if (!fs.existsSync(envPath)) continue;
    const token = readTokenFromEnvFile(envPath);
    if (token) return { token, source: envPath };
  }
  return { token: '', source: '' };
}

/**
 * Ask the gate endpoint whether a token actually authenticates.
 *
 * 401/403 is the endpoint telling us the credential is bad. Any other response
 * means auth was accepted even if the specific route 404s, which is what we
 * care about here. A transport error means we learned nothing — reported as
 * 'unreachable' rather than being folded into either verdict.
 *
 * @returns {Promise<{state:'valid'|'rejected'|'unreachable', detail:string}>}
 */
async function verifyGateToken(token, { endpoint = DEFAULT_ENDPOINT, timeoutMs = 2500 } = {}) {
  if (!token) return { state: 'rejected', detail: 'no token supplied' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'x-auth-token': token, accept: 'application/json,text/plain,*/*' },
    });
    if (response.status === 401 || response.status === 403) {
      return { state: 'rejected', detail: `endpoint rejected token (HTTP ${response.status})` };
    }
    return { state: 'valid', detail: `endpoint accepted token (HTTP ${response.status})` };
  } catch (error) {
    const reason = error?.name === 'AbortError' ? `timeout after ${timeoutMs}ms` : error?.message;
    return { state: 'unreachable', detail: `gate endpoint unreachable (${reason})` };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Write the token to the primary credential file at 0600, replacing any
 * existing entry rather than appending a second one.
 *
 * @returns {string} the path written
 */
function persistGateToken(token, targetPath = CREDENTIAL_PATHS[0]) {
  if (!token || !token.trim()) throw new Error('refusing to persist an empty gate token');
  const value = token.trim();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true, mode: 0o700 });

  let lines = [];
  if (fs.existsSync(targetPath)) {
    lines = fs
      .readFileSync(targetPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => {
        const normalized = line.trim().startsWith('export ')
          ? line.trim().slice('export '.length).trim()
          : line.trim();
        return !normalized.startsWith(`${TOKEN_KEY}=`);
      });
  }
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  lines.push(`${TOKEN_KEY}=${value}`);

  fs.writeFileSync(targetPath, `${lines.join('\n')}\n`, { mode: 0o600 });
  fs.chmodSync(targetPath, 0o600);
  return targetPath;
}

/** Cryptographically strong token suitable for the shared-secret gate. */
function generateGateToken() {
  return require('node:crypto').randomBytes(32).toString('base64url');
}

module.exports = {
  CREDENTIAL_PATHS,
  DEFAULT_ENDPOINT,
  TOKEN_KEY,
  generateGateToken,
  persistGateToken,
  resolveGateToken,
  verifyGateToken,
};
