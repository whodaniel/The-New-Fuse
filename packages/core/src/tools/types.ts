export interface ToolParameter {
  // Implementation needed
}
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
  // Implementation needed
}
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  handler(...args: any[]) => Promise<any>;
}

export interface ToolExecutionContext {
  // Implementation needed
}
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}