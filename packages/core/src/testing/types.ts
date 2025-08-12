export interface TestResult {
  name: string;
  success: boolean;
  duration?: number;
  error?: string;
}

export interface TestSuite {
  name: string;
  tests: Array<() => Promise<boolean> | boolean>;
}

export interface TestConfiguration {
  timeout?: number;
  retries?: number;
  parallel?: boolean;
}

export interface TestReporter {
  report(results: Map<string, TestResult[]>): string;
  save(results: Map<string, TestResult[]>, filePath: string): Promise<void>;
}