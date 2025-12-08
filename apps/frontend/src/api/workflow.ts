import { config } from '../config';

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  version: string;
  lastModified: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  input?: any;
  output?: any;
  error?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class WorkflowApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${config.apiUrl}/workflows`;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Request failed',
          message: errorData.message || 'Request failed'
        };
      } catch (e) {
        return {
          success: false,
          error: response.statusText || 'Request failed',
          message: response.statusText || 'Request failed'
        };
      }
    }

    try {
      const data = await response.json();
      return {
        success: true,
        data: data as T
      };
    } catch (e) {
      return {
        success: true,
        data: undefined,
        message: 'Request successful but no data returned'
      };
    }
  }

  async getWorkflows(): Promise<ApiResponse<{ workflows: Workflow[]; total: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });
      return this.handleResponse<{ workflows: Workflow[]; total: number }>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to fetch workflows'
      };
    }
  }

  async getWorkflow(id: string): Promise<ApiResponse<Workflow>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });
      return this.handleResponse<Workflow>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: `Failed to fetch workflow ${id}`
      };
    }
  }

  async createWorkflow(workflowData: {
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
  }): Promise<ApiResponse<Workflow>> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify(workflowData)
      });
      return this.handleResponse<Workflow>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to create workflow'
      };
    }
  }

  async updateWorkflow(id: string, workflowData: {
    name?: string;
    description?: string;
    nodes?: any[];
    edges?: any[];
  }): Promise<ApiResponse<Workflow>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify(workflowData)
      });
      return this.handleResponse<Workflow>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: `Failed to update workflow ${id}`
      };
    }
  }

  async executeWorkflow(workflowId: string, input?: any): Promise<ApiResponse<WorkflowExecution>> {
    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({
          workflowId,
          input: input || {}
        })
      });
      return this.handleResponse<WorkflowExecution>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: `Failed to execute workflow ${workflowId}`
      };
    }
  }

  async getExecutionStatus(executionId: string): Promise<ApiResponse<WorkflowExecution>> {
    try {
      const response = await fetch(`${this.baseUrl}/executions/${executionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include'
      });
      return this.handleResponse<WorkflowExecution>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: `Failed to get execution status ${executionId}`
      };
    }
  }

  async saveWorkflow(workflowData: {
    id?: string;
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
  }): Promise<ApiResponse<Workflow>> {
    try {
      const method = workflowData.id ? 'PATCH' : 'POST';
      const url = workflowData.id ? `${this.baseUrl}/${workflowData.id}` : `${this.baseUrl}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify(workflowData)
      });
      return this.handleResponse<Workflow>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to save workflow'
      };
    }
  }
}
