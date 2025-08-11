export interface TestResult {
  // Implementation needed
}
  name: string;
  success: boolean;
  duration?: number;
  error?: string;
}

export interface TestSuite {
  // Implementation needed
}
  name: string;
  tests: Array<() => Promise<boolean> | boolean>;
}

export interface TestConfiguration {
  // Implementation needed
}
  timeout?: number;
  retries?: number;
  parallel?: boolean;
}

export interface TestReporter {
  // Implementation needed
}
  report(results: Map<string, TestResult[]>): string;
  save(results: Map<string, TestResult[]>, filePath: string): Promise<void>;
}