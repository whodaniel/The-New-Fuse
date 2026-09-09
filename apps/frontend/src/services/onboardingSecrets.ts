/**
 * Onboarding secret scrubbing.
 *
 * Provider/integration credentials may exist in wizard form state, but must never
 * enter shared session payloads, greeter AI prompts, logs, or network bodies.
 * Matches the APIProviderSetupStep promise: keys stay local and are not transmitted.
 */

const SECRET_KEY_PATTERN =
  /(^|[_-])(api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|passwd|private[_-]?key|client[_-]?secret|bearer|credential|openai[_-]?key|anthropic[_-]?key|google[_-]?key|openrouter[_-]?key|supabase[_-]?key|stripe[_-]?key)(s)?$/i;

const SECRET_VALUE_PATTERN =
  /\b(sk-[a-z0-9_-]{16,}|sk-ant-[a-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,})\b/i;

/** Explicit allowlist for greeter / AI context — non-secret onboarding facts only. */
export const GREETER_SESSION_ALLOWLIST = [
  'name',
  'email',
  'role',
  'userType',
  'providerMode',
  'preferredModel',
  'preferredProvider',
  'workspacePath',
  'workspaceName',
  'authType',
  'selectedTools',
  'selectedIntegrations',
  'billingPlan',
  'usageCap',
  'openaiKeyConfigured',
  'anthropicKeyConfigured',
  'googleKeyConfigured',
  'openRouterKeyConfigured',
  'apiKeyConfigured',
] as const;

export type GreeterSessionAllowlistKey = (typeof GREETER_SESSION_ALLOWLIST)[number];

export function isOnboardingSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERN.test(key.trim());
}

export function looksLikeSecretValue(value: unknown): boolean {
  return typeof value === 'string' && SECRET_VALUE_PATTERN.test(value);
}

/**
 * Strip secret fields from an onboarding session patch before it enters shared state.
 * Present secret values become boolean `*Configured` flags so the UI can still show status.
 */
export function redactOnboardingSecrets(
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (isOnboardingSecretKey(key)) {
      const configuredKey = key.endsWith('Configured') ? key : `${key}Configured`;
      out[configuredKey] = Boolean(typeof value === 'string' ? value.trim() : value);
      continue;
    }
    if (looksLikeSecretValue(value)) {
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = redactOnboardingSecrets(value as Record<string, unknown>);
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** Build a greeter-safe projection: allowlisted keys only, after secret redaction. */
export function buildGreeterSafeSessionData(
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const redacted = redactOnboardingSecrets(data);
  const allow = new Set<string>(GREETER_SESSION_ALLOWLIST);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(redacted)) {
    if (allow.has(key)) out[key] = redacted[key];
  }
  return out;
}
