export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  handler: (...args: any[]) => Promise<any>;
}

export interface ToolExecutionContext {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}