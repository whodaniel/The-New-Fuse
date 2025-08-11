export interface AgentWorkflow {
  // Implementation needed
}
  id: string;
  name: string;
  description?: string;
  tasks: WorkflowTask[];
  apis?: {
  // Implementation needed
}
    [agentId: string]: APISpec;
  };
  configuration?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WorkflowTask {
  // Implementation needed
}
  id: string;
  name: string;
  description?: string;
  type: string;
  dependencies?: string[];
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
}

export interface APISpec {
  // Implementation needed
}
  // OpenAPI/Swagger spec URL
  specUrl?: string;
  // Manual endpoint definitions
  endpoints?: APIEndpoint[];
  // Authentication configuration
  auth?: {
  // Implementation needed
}
    type: 'basic' | 'bearer' | 'oauth2' | 'apiKey';
    credentials?: Record<string, string>;
  };
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface APIEndpoint {
  // Implementation needed
}
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  parameters?: APIParameter[];
  requestBody?: {
  // Implementation needed
}
    contentType: string;
    schema?: Record<string, unknown>;
  };
  responses?: {
  // Implementation needed
}
    [statusCode: string]: {
  // Implementation needed
}
      description: string;
      schema?: Record<string, unknown>;
    };
  };
}

export interface APIParameter {
  // Implementation needed
}
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  description?: string;
  default?: unknown;
}

export interface WorkflowExecutionContext {
  // Implementation needed
}
  workflowId: string;
  executionId: string;
  currentTask?: string;
  variables: Record<string, unknown>;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export interface WorkflowStep {
  // Implementation needed
}
  id: string;
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  retryCount: number;
}

export interface WorkflowEngine {
  // Implementation needed
}
  executeWorkflow(workflow: AgentWorkflow, context?: Record<string, unknown>): Promise<WorkflowExecutionContext>;
  pauseWorkflow(executionId: string): Promise<void>;
  resumeWorkflow(executionId: string): Promise<void>;
  cancelWorkflow(executionId: string): Promise<void>;
  getWorkflowStatus(executionId: string): Promise<WorkflowExecutionContext>;
}