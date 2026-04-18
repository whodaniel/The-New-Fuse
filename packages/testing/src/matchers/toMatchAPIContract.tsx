import { createMatcher } from './utils.js';
import { z } from 'zod';

export type APIContract = {
  status: number;
  headers?: Record<string, string>;
  schema: z.ZodSchema;
};

interface APIResponse {
  status: number;
  headers: Record<string, string>;
  data: unknown;
}

export const toMatchAPIContract = createMatcher(
  (received: APIResponse, contract: APIContract) => {
    // Check status code
    if (received.status !== contract.status) {
      return false;
    }

    // Check required headers if specified
    if (contract.headers) {
      for (const [key, value] of Object.entries(contract.headers)) {
        if (received.headers[key.toLowerCase()] !== value) {
          return false;
        }
      }
    }

    // Validate response body against schema
    const result = contract.schema.safeParse(received.data);
    return result.success;
  },
  (received, contract) => {
    if (received.status !== contract.status) {
      return `Expected status code ${contract.status}, but received ${received.status}`;
    }

    if (contract.headers) {
      for (const [key, value] of Object.entries(contract.headers)) {
        const actualValue = received.headers[key.toLowerCase()];
        if (actualValue !== value) {
          return `Expected header "${key}" to be "${value}", but got "${actualValue}"`;
        }
      }
    }

    const result = contract.schema.safeParse(received.data);
    if (!result.success) {
      return `Response body did not match schema:\n${result.error.message}`;
    }

    return 'Response matched API contract';
  },
  () => 'Expected response not to match API contract, but it did'
);