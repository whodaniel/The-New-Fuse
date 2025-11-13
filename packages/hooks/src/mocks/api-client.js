/**
 * Mock types for API client services
 * These declarations ensure the hooks package builds properly
 * without external dependencies on the actual API client package.
 */
export class AgentService {
    getAgents(page, limit) {
        return Promise.resolve({ agents: [], total: 0 });
    }
    getAgent(id) {
        return Promise.resolve({
            id,
            name: 'Mock Agent',
            type: 'default',
            status: 'active',
            capabilities: []
        });
    }
    createAgent(data) {
        return Promise.resolve({
            id: 'mock-id',
            name: data.name,
            description: data.description,
            type: data.type,
            status: 'active',
            capabilities: data.capabilities || []
        });
    }
    updateAgent(id, data) {
        return Promise.resolve({
            id,
            name: data.name || 'Mock Agent',
            description: data.description,
            type: 'default',
            status: data.status || 'active',
            capabilities: data.capabilities || []
        });
    }
    deleteAgent(id) {
        return Promise.resolve();
    }
}
export class AuthService {
    isAuthenticated() {
        return Promise.resolve(false);
    }
    login(credentials) {
        return Promise.resolve({ token: 'mock-token', user: { id: 'user-1', email: credentials.email } });
    }
    register(data) {
        return Promise.resolve({ token: 'mock-token', user: { id: 'user-1', email: data.email, name: data.name } });
    }
    logout() {
        return Promise.resolve();
    }
    getCurrentUser() {
        return Promise.resolve({ id: 'user-1', email: 'user@example.com' });
    }
}
export class WorkflowService {
    getWorkflows(page, limit) {
        return Promise.resolve({ workflows: [], total: 0 });
    }
    getWorkflow(id) {
        return Promise.resolve({
            id,
            name: 'Mock Workflow',
            status: 'active',
            steps: []
        });
    }
    createWorkflow(data) {
        return Promise.resolve({
            id: 'mock-id',
            name: data.name,
            description: data.description,
            status: 'draft',
            steps: (data.steps || []).map((step, index) => ({
                id: `step-${index},`,
                name: step.name || `Step ${index}`,
                type: step.type || 'generic',
                config: step.config || {}
            }))
        });
    }
    updateWorkflow(id, data) {
        return Promise.resolve({
            id,
            name: data.name || 'Mock Workflow',
            description: data.description,
            status: data.status || 'active',
            steps: (data.steps || []).map((step, index) => ({
                id: step.id || step - $
            }), { index }, `
        name: step.name || Step ${index}` `,
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
})
        });
    }
}
//# sourceMappingURL=api-client.js.map