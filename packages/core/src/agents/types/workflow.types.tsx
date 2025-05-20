export interface AgentWorkflow {
    id: string;
    name: string;
    description?: string;
    tasks: WorkflowTask[];
    apis?: {
        [agentId: string]: APISpec;
    };
    configuration?: Record<string, any>;
    metadata?: Record<string, any>;
}

export interface APISpec {
    // OpenAPI/Swagger spec URL
    specUrl?: string;
    // Manual endpoint definitions
    endpoints?: APIEndpoint[];
    // Authentication configuration
    auth?: {
        type: 'basic' | 'bearer' | 'oauth2' | 'apiKey';
        config: Record<string, any>;
    };
}

export interface APIEndpoint {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description?: string;
    parameters?: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
    responses?: Record<string, any>;
}