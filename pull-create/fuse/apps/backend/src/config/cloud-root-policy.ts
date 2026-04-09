export interface CloudRootPolicyResult {
  ok: boolean;
  reason?: string;
}

function isLocalTarget(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('::1') ||
    lower.startsWith('sqlite:')
  );
}

export function validateCloudRootPolicy(
  nodeEnv: string,
  databaseUrl?: string,
  redisUrl?: string
): CloudRootPolicyResult {
  // Test runs may use ephemeral local services.
  if (nodeEnv === 'test') {
    return { ok: true };
  }

  const cloudRequired = process.env.TNF_REQUIRE_CLOUD_DB !== '0';
  const allowLocal = process.env.TNF_ALLOW_LOCAL_DB === '1';

  if (!cloudRequired || allowLocal) {
    return { ok: true };
  }

  if (!databaseUrl || databaseUrl.trim() === '') {
    return { ok: false, reason: 'DATABASE_URL is required for cloud-rooted execution' };
  }

  if (isLocalTarget(databaseUrl)) {
    return {
      ok: false,
      reason: 'DATABASE_URL points to local DB while cloud-rooted execution is required',
    };
  }

  if (redisUrl && isLocalTarget(redisUrl)) {
    return {
      ok: false,
      reason: 'REDIS_URL points to local Redis while cloud-rooted execution is required',
    };
  }

  return { ok: true };
}

export function enforceCloudRootPolicy(
  nodeEnv: string,
  databaseUrl?: string,
  redisUrl?: string
): void {
  const result = validateCloudRootPolicy(nodeEnv, databaseUrl, redisUrl);
  if (!result.ok) {
    throw new Error(
      `${result.reason}. Set TNF_ALLOW_LOCAL_DB=1 for an explicit temporary local override.`
    );
  }
}
