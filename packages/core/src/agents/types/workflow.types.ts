export interface AgentWorkflow {
  id: string;
  name: string;
  description?: string;
  tasks: WorkflowTask[];
  apis?: {
    [agentId: string]: APISpec;
  };
  configuration?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WorkflowTask {
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
  // OpenAPI/Swagger spec URL
  specUrl?: string;
  // Manual endpoint definitions
  endpoints?: APIEndpoint[];
  // Authentication configuration
  auth?: {
    type: 'basic' | 'bearer' | 'oauth2' | 'apiKey';
    credentials?: Record<string, string>;
  };
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  parameters?: APIParameter[];
  requestBody?: {
    contentType: string;
    schema?: Record<string, unknown>;
  };
  responses?: {
    [statusCode: string]: {
      description: string;
      schema?: Record<string, unknown>;
    };
  };
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  description?: string;
  default?: unknown;
}

export interface WorkflowExecutionContext {
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
  executeWorkflow(
    workflow: AgentWorkflow,
    context?: Record<string, unknown>,
  ): Promise<WorkflowExecutionContext>;
  pauseWorkflow(executionId: string): Promise<void>;
  resumeWorkflow(executionId: string): Promise<void>;
  cancelWorkflow(executionId: string): Promise<void>;
  getWorkflowStatus(executionId: string): Promise<WorkflowExecutionContext>;
}
