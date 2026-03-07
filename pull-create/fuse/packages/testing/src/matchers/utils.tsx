import { MatcherState } from '@jest/expect';
import { ZodSchema } from 'zod';

export interface CustomMatcherResult {
  pass: boolean;
  message: () => string;
}

export function createMatcher<T = any>(
  predicate: (received: T, ...args: any[]) => boolean | Promise<boolean>,
  failMessage: (received: T, ...args: any[]) => string,
  passMessage: (received: T, ...args: any[]) => string
) {
  return async function matcher(
    this: MatcherState,
    received: T,
    ...args: any[]
  ): Promise<CustomMatcherResult> {
    const pass = await predicate(received, ...args);
    const message = (): any => (pass ? passMessage(received, ...args) : failMessage(received, ...args));

    return { pass, message };
  };
}

export function validateSchema(value: unknown, schema: ZodSchema): any {
  const result = schema.safeParse(value);
  return {
    success: result.success,
    error: !result.success ? result.error.issues[0]?.message : undefined
  };
}