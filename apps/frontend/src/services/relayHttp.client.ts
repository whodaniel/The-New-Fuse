type RelayJson = Record<string, unknown> | unknown[] | null;

function isLoopbackBase(baseUrl: string): boolean {
  try {
    const host = new URL(baseUrl).hostname;
    return host === '127.0.0.1' || host === 'localhost' || host === '::1';
  } catch {
    return /127\.0\.0\.1|localhost/i.test(baseUrl);
  }
}

function isBrowserOnLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

async function relayRequest(baseUrl: string, path: string): Promise<Response | null> {
  // Hosted Pages CSP blocks http://127.0.0.1 — skip before fetch to avoid console noise.
  if (isLoopbackBase(baseUrl) && !isBrowserOnLocalhost()) {
    return null;
  }
  if (!baseUrl?.trim()) return null;
  try {
    return await globalThis.fetch(`${baseUrl}${path}`);
  } catch {
    return null;
  }
}

export async function relayGetJson<T extends RelayJson>(
  baseUrl: string,
  path: string,
  fallback: T
): Promise<T> {
  const response = await relayRequest(baseUrl, path);
  if (!response?.ok) return fallback;
  return (await response.json()) as T;
}

export async function relayGetOptionalJson<T extends RelayJson>(
  baseUrl: string,
  path: string
): Promise<T | null> {
  const response = await relayRequest(baseUrl, path);
  if (!response?.ok) return null;
  return (await response.json()) as T;
}
