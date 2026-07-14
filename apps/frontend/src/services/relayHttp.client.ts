type RelayJson = Record<string, unknown> | unknown[] | null;

async function relayRequest(baseUrl: string, path: string): Promise<Response | null> {
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
