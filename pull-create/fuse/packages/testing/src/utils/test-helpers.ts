/**
 * Common Test Helpers
 *
 * Shared utilities for testing across the monorepo.
 */

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await sleep(interval);
  }

  throw new Error('Timeout waiting for condition');
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock function with TypeScript support
 */
export function mockFn<T extends (...args: any[]) => any>(): jest.Mock<ReturnType<T>, Parameters<T>> {
  return jest.fn();
}

/**
 * Flush all pending promises
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Create a deferred promise
 */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Generate a random string
 */
export function randomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate a random email
 */
export function randomEmail(): string {
  return `test-${randomString()}@example.com`;
}

/**
 * Generate a random UUID (simple version)
 */
export function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a spy object with all methods as jest.Mock
 */
export function createSpyObj<T extends Record<string, any>>(
  baseName: string,
  methodNames: (keyof T)[]
): { [K in keyof T]: jest.Mock } {
  const obj: any = {};
  methodNames.forEach((methodName) => {
    obj[methodName] = jest.fn().mockName(`${baseName}.${String(methodName)}`);
  });
  return obj;
}

/**
 * Assert that a function throws an error
 */
export async function expectThrowsAsync(
  fn: () => Promise<any>,
  errorMessageOrType?: string | RegExp | (new (...args: any[]) => Error)
): Promise<void> {
  let didThrow = false;
  let error: any;

  try {
    await fn();
  } catch (e) {
    didThrow = true;
    error = e;
  }

  if (!didThrow) {
    throw new Error('Expected function to throw an error');
  }

  if (errorMessageOrType) {
    if (typeof errorMessageOrType === 'string') {
      if (!error.message.includes(errorMessageOrType)) {
        throw new Error(
          `Expected error message to include "${errorMessageOrType}", but got "${error.message}"`
        );
      }
    } else if (errorMessageOrType instanceof RegExp) {
      if (!errorMessageOrType.test(error.message)) {
        throw new Error(
          `Expected error message to match ${errorMessageOrType}, but got "${error.message}"`
        );
      }
    } else {
      if (!(error instanceof errorMessageOrType)) {
        throw new Error(
          `Expected error to be instance of ${errorMessageOrType.name}, but got ${error.constructor.name}`
        );
      }
    }
  }
}

/**
 * Suppress console output during test
 */
export function suppressConsole(
  methods: ('log' | 'warn' | 'error' | 'info')[] = ['log', 'warn', 'error', 'info']
): () => void {
  const originalMethods: any = {};

  methods.forEach((method) => {
    originalMethods[method] = console[method];
    console[method] = jest.fn();
  });

  return () => {
    methods.forEach((method) => {
      console[method] = originalMethods[method];
    });
  };
}

/**
 * Create a mock date
 */
export function mockDate(date: Date | string | number): () => void {
  const RealDate = Date;
  const fixedDate = new RealDate(date);

  (global as any).Date = class extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(fixedDate.getTime());
      } else if (args.length === 1) {
        // Avoid spread to satisfy TS5+ tuple constraint
        super(args[0] as any);
      } else {
        // Fallback
        super(fixedDate.getTime());
      }
    }

    static now() {
      return fixedDate.getTime();
    }
  };

  return () => {
    global.Date = RealDate;
  };
}
