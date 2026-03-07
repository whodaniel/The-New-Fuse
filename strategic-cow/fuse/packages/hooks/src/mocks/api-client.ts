/**
 * Mock types for API client services
 * These declarations ensure the hooks package builds properly
 * without external dependencies on the actual API client package.
 */

// Common types
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Agent types and service
export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  capabilities: string[];
}

export interface AgentCreateData {
  name: string;
  description?: string;
  type: string;
  capabilities?: string[];
}

export interface AgentUpdateData {
  name?: string;
  description?: string;
  status?: string;
  capabilities?: string[];
}

export class AgentService {
  getAgents(page?: number, limit?: number): Promise<{ agents: Agent[], total: number }> {
    return Promise.resolve({ agents: [], total: 0 });
  }
  
  getAgent(id: string): Promise<Agent> {
    return Promise.resolve({
      id,
      name: 'Mock Agent',
      type: 'default',
      status: 'active',
      capabilities: []
    });
  }
  
  createAgent(data: AgentCreateData): Promise<Agent> {
    return Promise.resolve({
      id: 'mock-id',
      name: data.name,
      description: data.description,
      type: data.type,
      status: 'active',
      capabilities: data.capabilities || []
    });
  }
  
  updateAgent(id: string, data: AgentUpdateData): Promise<Agent> {
    return Promise.resolve({
      id,
      name: data.name || 'Mock Agent',
      description: data.description,
      type: 'default',
      status: data.status || 'active',
      capabilities: data.capabilities || []
    });
  }
  
  deleteAgent(id: string): Promise<void> {
    return Promise.resolve();
  }
}

// Auth types and service
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export class AuthService {
  isAuthenticated(): Promise<boolean> {
    return Promise.resolve(false);
  }

  login(credentials: LoginCredentials): Promise<{ token: string; user: any }> {
    return Promise.resolve({ token: 'mock-token', user: { id: 'user-1', email: credentials.email } });
  }
  
  register(data: RegisterData): Promise<{ token: string; user: any }> {
    return Promise.resolve({ token: 'mock-token', user: { id: 'user-1', email: data.email, name: data.name } });
  }
  
  logout(): Promise<void> {
    return Promise.resolve();
  }
  
  getCurrentUser(): Promise<any> {
    return Promise.resolve({ id: 'user-1', email: 'user@example.com' });
  }
}

// Workflow types and service
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
}

export interface WorkflowCreateData {
  name: string;
  description?: string;
  steps?: Partial<WorkflowStep>[];
}

export interface WorkflowUpdateData {
  name?: string;
  description?: string;
  status?: string;
  steps?: Partial<WorkflowStep>[];
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: string;
  result: any;
  createdAt: Date;
  completedAt?: Date;
}

export class WorkflowService {
  getWorkflows(page?: number, limit?: number): Promise<{ workflows: Workflow[], total: number }> {
    return Promise.resolve({ workflows: [], total: 0 });
  }
  
  getWorkflow(id: string): Promise<Workflow> {
    return Promise.resolve({
      id,
      name: 'Mock Workflow',
      status: 'active',
      steps: []
    });
  }
  
  createWorkflow(data: WorkflowCreateData): Promise<Workflow> {
    return Promise.resolve({
      id: 'mock-id',
      name: data.name,
      description: data.description,
      status: 'draft',
      steps: (data.steps || []).map((step, index) => ({
        id: `step-${index}`,
        name: step.name || `Step ${index}`,
        type: step.type || 'generic',
        config: step.config || {}
      }))
    });
  }
  
  updateWorkflow(id: string, data: WorkflowUpdateData): Promise<Workflow> {
    return Promise.resolve({
      id,
      name: data.name || 'Mock Workflow',
      description: data.description,
      status: data.status || 'active',
      steps: (data.steps || []).map((step, index) => ({
        id: step.id || `step-${index}`,
        name: step.name || `Step ${index}`,
        type: step.type || 'generic',
        config: step.config || {}
      }))
    });
  }
  
  deleteWorkflow(id: string): Promise<void> {
    return Promise.resolve();
  }
  
  executeWorkflow(id: string, input?: Record<string, any>): Promise<WorkflowExecution> {
    return Promise.resolve({ 
      id: 'exec-1',
      workflowId: id,
      status: 'completed',
      result: {},
      createdAt: new Date()
    });
  }

  getWorkflowExecutions(id: string, page?: number, limit?: number): Promise<{ executions: WorkflowExecution[], total: number }> {
    return Promise.resolve({ 
      executions: [{ 
        id: 'exec-1',
        workflowId: id,
        status: 'completed',
        result: {},
        createdAt: new Date()
      }], 
      total: 1 
    });
  }
}