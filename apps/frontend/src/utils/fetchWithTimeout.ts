import { authFetch } from './authToken';

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: FetchWithTimeoutOptions,
  timeoutMs?: number
): Promise<Response> {
  const timeout = timeoutMs ?? init?.timeout ?? 10000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('timeout')), timeout);
  });

  try {
    return (await Promise.race([authFetch(input, init), timeoutPromise])) as Response;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
