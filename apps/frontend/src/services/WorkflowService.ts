/**
 * Workflow Service - Production ready service for workflow management
 */

import { Edge, Node } from 'reactflow';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags?: string[];
  metadata?: Record<string, any>;
  triggers?: any[];
  variables?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  logs: WorkflowExecutionLog[];
  nodeExecutions: NodeExecution[];
}

export interface WorkflowExecutionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  nodeId?: string;
  metadata?: Record<string, any>;
}

export interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  attempts: number;
  logs: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'low' | 'medium' | 'high';
  popularity: 'low' | 'medium' | 'high';
  nodes: Node[];
  edges: Edge[];
  metadata?: Record<string, any>;
}

class WorkflowService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = '/api', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Workflow API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Workflow CRUD operations
  async getWorkflows(): Promise<Workflow[]> {
    const payload = await this.request<any>('/workflows');
    const workflows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.workflows)
        ? payload.workflows
        : [];
    return workflows.map((workflow: any) => this.transformWorkflow(workflow));
  }

  async getWorkflow(id: string): Promise<Workflow> {
    try {
      const workflow = await this.request<any>(`/workflows/${id}`);
      return this.transformWorkflow(workflow);
    } catch (error) {
      console.error(`Failed to fetch workflow ${id}:`, error);
      throw error;
    }
  }

  async createWorkflow(
    workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Workflow> {
    try {
      const created = await this.request<any>('/workflows', {
        method: 'POST',
        body: JSON.stringify(workflow),
      });
      return this.transformWorkflow(created);
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw error;
    }
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    try {
      const updated = await this.request<any>(`/workflows/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return this.transformWorkflow(updated);
    } catch (error) {
      console.error(`Failed to update workflow ${id}:`, error);
      throw error;
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    try {
      await this.request(`/workflows/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`Failed to delete workflow ${id}:`, error);
      throw error;
    }
  }

  // Workflow execution
  async executeWorkflow(
    workflowId?: string,
    input?: Record<string, any>,
    definition?: { nodes: Node[]; edges: Edge[] }
  ): Promise<WorkflowExecution> {
    try {
      const response = await this.request<any>('/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId,
          input,
          definition,
        }),
      });
      return this.transformExecution(response);
    } catch (error) {
      console.error(`Failed to execute workflow ${workflowId || 'dynamic'}:`, error);
      throw error;
    }
  }

  async executeWorkflowViaWebhook(
    workflowId: string,
    payload: Record<string, any>,
    options?: { triggerId?: string; secret?: string; source?: string }
  ): Promise<{ executionId: string; status: string; workflowId: string }> {
    const triggerPath = options?.triggerId
      ? `/workflows/${workflowId}/webhook/${options.triggerId}`
      : `/workflows/${workflowId}/webhook`;

    const headers: Record<string, string> = {};
    if (options?.secret) headers['x-workflow-secret'] = options.secret;
    if (options?.source) headers['x-workflow-source'] = options.source;

    return this.request<{ executionId: string; status: string; workflowId: string }>(triggerPath, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
      headers,
    });
  }

  async getExecution(executionId: string): Promise<WorkflowExecution> {
    try {
      const execution = await this.request<any>(`/workflows/executions/${executionId}`);
      return this.transformExecution(execution);
    } catch (error) {
      console.error(`Failed to fetch execution ${executionId}:`, error);
      throw error;
    }
  }

  async getExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    try {
      const endpoint = workflowId
        ? `/workflows/executions?workflowId=${encodeURIComponent(workflowId)}`
        : '/workflows/executions';
      const payload = await this.request<any>(endpoint);
      const executions = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.executions)
          ? payload.executions
          : [];
      return executions.map((execution: any) => this.transformExecution(execution));
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      throw error;
    }
  }

  async publishWorkflow(workflowId: string): Promise<Workflow> {
    const published = await this.request<any>(`/workflows/${workflowId}/publish`, {
      method: 'POST',
    });
    return this.transformWorkflow(published);
  }

  async cancelExecution(executionId: string): Promise<WorkflowExecution> {
    try {
      const execution = await this.request<any>(`/workflows/executions/${executionId}/cancel`, {
        method: 'POST',
      });
      return this.transformExecution(execution);
    } catch (error) {
      console.error(`Failed to cancel execution ${executionId}:`, error);
      throw error;
    }
  }

  async pauseExecution(executionId: string): Promise<WorkflowExecution> {
    try {
      const execution = await this.request<any>(`/workflows/executions/${executionId}/pause`, {
        method: 'POST',
      });
      return this.transformExecution(execution);
    } catch (error) {
      console.error(`Failed to pause execution ${executionId}:`, error);
      throw error;
    }
  }

  async resumeExecution(executionId: string): Promise<WorkflowExecution> {
    try {
      const execution = await this.request<any>(`/workflows/executions/${executionId}/resume`, {
        method: 'POST',
      });
      return this.transformExecution(execution);
    } catch (error) {
      console.error(`Failed to resume execution ${executionId}:`, error);
      throw error;
    }
  }

  // Workflow templates
  async getTemplates(): Promise<WorkflowTemplate[]> {
    try {
      return await this.request<WorkflowTemplate[]>('/workflows/templates');
    } catch (error) {
      console.error('Failed to fetch workflow templates:', error);
      throw error;
    }
  }

  async getTemplate(id: string): Promise<WorkflowTemplate> {
    try {
      return await this.request<WorkflowTemplate>(`/workflows/templates/${id}`);
    } catch (error) {
      console.error(`Failed to fetch template ${id}:`, error);
      throw error;
    }
  }

  async createFromTemplate(
    templateId: string,
    name: string,
    description?: string
  ): Promise<Workflow> {
    const workflow = await this.request<any>('/workflows/from-template', {
      method: 'POST',
      body: JSON.stringify({
        templateId,
        name,
        description,
      }),
    });
    return this.transformWorkflow(workflow);
  }

  // Validation
  async validateWorkflow(workflow: Workflow): Promise<{ valid: boolean; errors: string[] }> {
    try {
      return await this.request<{ valid: boolean; errors: string[] }>('/workflows/validate', {
        method: 'POST',
        body: JSON.stringify(workflow),
      });
    } catch (error) {
      console.error('Failed to validate workflow:', error);
      throw error;
    }
  }

  // Real-time updates via WebSocket
  subscribeToExecution(
    executionId: string,
    callback: (execution: WorkflowExecution) => void
  ): () => void {
    // Determine WebSocket URL
    let wsUrl: string;
    const wsEnvUrl = import.meta.env.VITE_WS_URL;

    if (wsEnvUrl && (wsEnvUrl.startsWith('ws://') || wsEnvUrl.startsWith('wss://'))) {
      // Use configured WS URL
      const baseUrl = wsEnvUrl.replace(/\/$/, '');
      wsUrl = `${baseUrl}/api/workflows/executions/${executionId}/subscribe`;
    } else {
      // Fallback to current host (relative) and upgrade protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/api/workflows/executions/${executionId}/subscribe`;
    }

    // Connect to WebSocket
    // Note: In development with Vite, this might go through the proxy configured in vite.config.ts
    // In production, it expects the backend to be served at /api or the WS URL to be exact.
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const execution = JSON.parse(event.data);
          callback(this.transformExecution(execution));
        } catch (error) {
          console.error('Failed to parse execution update:', error);
        }
      };

      ws.onerror = (_error) => {
        // Suppress noisy errors in console if it's just a connection refusal (common in dev/demos)
        // console.warn('WebSocket connection error - real-time updates may be unavailable:', error);
      };

      ws.onopen = () => {
        // console.log('WebSocket connected');
      };

      ws.onclose = () => {
        // console.log('WebSocket disconnected');
      };
    } catch (e) {
      console.warn('Could not establish WebSocket connection', e);
    }

    // Return cleanup function
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }

  // Transform API responses to frontend types
  private transformWorkflow(apiWorkflow: any): Workflow {
    const definition = apiWorkflow.definition || {};
    return {
      ...apiWorkflow,
      status: String(apiWorkflow.status || 'draft').toLowerCase(),
      nodes: apiWorkflow.nodes || definition.nodes || [],
      edges: apiWorkflow.edges || definition.edges || [],
      version: apiWorkflow.version || definition.version || 1,
      createdAt: new Date(apiWorkflow.createdAt || Date.now()),
      updatedAt: new Date(apiWorkflow.updatedAt || Date.now()),
    };
  }

  private transformExecution(apiExecution: any): WorkflowExecution {
    const startTime = apiExecution.startTime || apiExecution.startedAt || Date.now();
    const endTime = apiExecution.endTime || apiExecution.completedAt;
    return {
      ...apiExecution,
      status: String(apiExecution.status || 'pending').toLowerCase(),
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : undefined,
      logs:
        apiExecution.logs?.map((log: any) => ({
          ...log,
          level: String(log.level || 'info').toLowerCase(),
          timestamp: new Date(log.timestamp),
        })) || [],
      nodeExecutions:
        apiExecution.nodeExecutions?.map((nodeExec: any) => ({
          ...nodeExec,
          status: String(nodeExec.status || 'pending').toLowerCase(),
          startTime: nodeExec.startTime ? new Date(nodeExec.startTime) : undefined,
          endTime: nodeExec.endTime ? new Date(nodeExec.endTime) : undefined,
        })) || [],
    };
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
export default WorkflowService;
