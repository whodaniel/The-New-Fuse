import { logger } from './logger.js';

export interface RetryOptions {
  maxAttempts?: number;
  backoff?: number;
  maxBackoff?: number;
  timeout?: number;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    backoff = 1000,
    maxBackoff = 10000,
    timeout = 30000
  } = options;

  let attempt = 0;
  const startTime = Date.now();

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt === maxAttempts || Date.now() - startTime > timeout) {
        throw error;
      }

      const delay = Math.min(backoff * Math.pow(2, attempt - 1), maxBackoff);
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, { error });
      await new Promise(resolv(e: any) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry failed: max attempts exceeded');
}