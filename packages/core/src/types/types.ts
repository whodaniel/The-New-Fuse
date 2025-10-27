export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute(parameters: any): Promise<any>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
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

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}
