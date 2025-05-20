export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  format?: string;
  minimum?: number;
  maximum?: number;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: Record<string, any>) => Promise<any>;
}

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  executionId: string;
  result?: any;
  error?: string;
  duration: number;
}
