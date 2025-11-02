export interface AgentWorkflow { id: string;
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
    type: 'basic' | 'bearer' | 'oauth2' | 'apiKey'
  method: GET | 'POST' | 'PUT' | 'DELETE' | '