import { config } from '../config';
import type { ApiError, ApiResponse } from '../types/api-response';

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

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: {
    nodes: any[];
    edges: any[];
  };
  isPublic: boolean;
  metadata?: any;
  usageCount: number;
}

export class WorkflowApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${config.apiUrl}/workflows`;
  }

  private toApiError(error: unknown, code: string = 'REQUEST_FAILED'): ApiError {
    if (typeof error === 'string') {
      return { code, message: error };
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
        return { code, message: maybeMessage };
      }
    }

    return { code, message: 'Request failed' };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return {
          success: false,
          error: this.toApiError(errorData?.message || 'Request failed'),
          message: errorData.message || 'Request failed',
        };
      } catch {
        return {
          success: false,
          error: this.toApiError(response.statusText || 'Request failed'),
          message: response.statusText || 'Request failed',
        };
      }
    }

    try {
      const data = await response.json();
      return {
        success: true,
        data: data as T,
      };
    } catch {
      return {
        success: true,
        data: undefined,
        message: 'Request successful but no data returned',
      };
    }
  }

  async getWorkflows(): Promise<ApiResponse<{ workflows: Workflow[]; total: number }>> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
      });
      return this.handleResponse<{ workflows: Workflow[]; total: number }>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: 'Failed to fetch workflows',
      };
    }
  }

  async getWorkflow(id: string): Promise<ApiResponse<Workflow>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
      });
      return this.handleResponse<Workflow>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to fetch workflow ${id}`,
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
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify(workflowData),
      });
      return this.handleResponse<Workflow>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: 'Failed to create workflow',
      };
    }
  }

  async updateWorkflow(
    id: string,
    workflowData: {
      name?: string;
      description?: string;
      nodes?: any[];
      edges?: any[];
    }
  ): Promise<ApiResponse<Workflow>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify(workflowData),
      });
      return this.handleResponse<Workflow>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to update workflow ${id}`,
      };
    }
  }

  async executeWorkflow(workflowId: string, input?: any): Promise<ApiResponse<WorkflowExecution>> {
    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          workflowId,
          input: input || {},
        }),
      });
      return this.handleResponse<WorkflowExecution>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to execute workflow ${workflowId}`,
      };
    }
  }

  async getExecutionStatus(executionId: string): Promise<ApiResponse<WorkflowExecution>> {
    try {
      const response = await fetch(`${this.baseUrl}/executions/${executionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
      });
      return this.handleResponse<WorkflowExecution>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to get execution status ${executionId}`,
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
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify(workflowData),
      });
      return this.handleResponse<Workflow>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: 'Failed to save workflow',
      };
    }
  }

  async publishWorkflow(id: string): Promise<ApiResponse<Workflow>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
      });
      return this.handleResponse<Workflow>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to publish workflow ${id}`,
      };
    }
  }

  async getWorkflowTemplates(category?: string): Promise<ApiResponse<WorkflowTemplate[]>> {
    try {
      const url = category
        ? `${config.apiUrl}/workflow-templates?category=${category}`
        : `${config.apiUrl}/workflow-templates`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
      });
      return this.handleResponse<WorkflowTemplate[]>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: 'Failed to fetch workflow templates',
      };
    }
  }

  async getWorkflowTemplate(id: string): Promise<ApiResponse<WorkflowTemplate>> {
    try {
      const response = await fetch(`${config.apiUrl}/workflow-templates/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
      });
      return this.handleResponse<WorkflowTemplate>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to fetch workflow template ${id}`,
      };
    }
  }

  async createWorkflowTemplate(
    data: Partial<WorkflowTemplate>
  ): Promise<ApiResponse<WorkflowTemplate>> {
    try {
      const response = await fetch(`${config.apiUrl}/workflow-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return this.handleResponse<WorkflowTemplate>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: 'Failed to create workflow template',
      };
    }
  }

  async updateWorkflowTemplate(
    id: string,
    data: Partial<WorkflowTemplate>
  ): Promise<ApiResponse<WorkflowTemplate>> {
    try {
      const response = await fetch(`${config.apiUrl}/workflow-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return this.handleResponse<WorkflowTemplate>(response);
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to update workflow template ${id}`,
      };
    }
  }

  async deleteWorkflowTemplate(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${config.apiUrl}/workflow-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        credentials: 'include',
      });

      const result = await this.handleResponse<any>(response);
      return {
        success: result.success,
        data: result.success,
        error: result.error,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: this.toApiError(error, 'NETWORK_ERROR'),
        message: `Failed to delete workflow template ${id}`,
      };
    }
  }
}
