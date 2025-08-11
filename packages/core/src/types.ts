export interface Tool {
  // Implementation needed
}
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute(parameters: any) => Promise<any>;
}

export interface ToolParameter {
  // Implementation needed
}
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

export interface ToolExecutionResult {
  // Implementation needed
}
  id: string;
  toolId: string;
  parameters: any;
  result?: any;
  error?: Error;
  timestamp: Date;
  success: boolean;
}

export interface ToolDefinition {
  // Implementation needed
}
  name: string;
  description: string;
  parameters: Record<string, any>;
}
