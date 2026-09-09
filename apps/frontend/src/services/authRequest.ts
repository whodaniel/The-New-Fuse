/** Bounded auth operations; transient failures never mean a rejected credential. */
export class AuthTransientError extends Error {
  constructor(
    message: string,
    readonly status = 0
  ) {
    super(message);
    this.name = 'AuthTransientError';
  }
}

export const AUTH_TIMEOUT_MS = 6_000;

export async function withAuthDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new AuthTransientError('Unable to verify your session. Please retry.'));
    }, AUTH_TIMEOUT_MS);
  });
  try {
    return await Promise.race([operation(controller.signal), timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/** Read the body within the deadline too, so stalled JSON cannot strand callers. */
export function authRequest(url: string, init: RequestInit = {}): Promise<Response> {
  return withAuthDeadline(async (signal) => {
    const response = await fetch(url, { ...init, signal });
    const body = await response.arrayBuffer();
    return new Response(body.byteLength ? body : null, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  });
}
