export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters?: ToolParameter[];
  execute(parameters: any): Promise<any>;
}

export interface ToolExecutionResult {
  id: string;
  toolId: string;
  parameters: any;
  result?: any;
  error?: Error;
  timestamp: Date;
  success: boolean;
}

export interface Test {
  name: string;
  test: () => Promise<boolean> | boolean;
}

export interface TestSuite {
  name: string;
  tests: Test[];
}

export interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

export interface TestConfiguration {
  timeout?: number;
  retries?: number;
}
