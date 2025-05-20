// This resolves the missing Jest globals in test files
declare global {
  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const test: (name: string, fn: () => void | Promise<void>) => void;
  const expect: unknown;
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const afterEach: (fn: () => void | Promise<void>) => void;
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
  const jest: {
    fn: () => any;
    mock: (path: string) => any;
    spyOn: (obj: unknown, method: string) => any;
    clearAllMocks: () => void;
    [key: string]: unknown;
  };
}

export {};
