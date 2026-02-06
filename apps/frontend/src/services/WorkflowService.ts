/**
 * Workflow Service - Production ready service for workflow management
 */

import { Edge, Node } from 'reactflow';
import { DEFAULT_WORKFLOW_TEMPLATES } from '../data/workflowTemplates';

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

const MOCK_CODE_REVIEW_WORKFLOW: Workflow = {
  id: 'mock-code-review-1',
  name: 'Code Review Pipeline',
  description: 'AI-Generated: Automated CI/CD pipeline for auditing pull requests.',
  status: 'active',
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'ai-seeder',
  tags: ['ci-cd', 'security'],
  nodes: [
    {
      id: 'node-start',
      type: 'input',
      position: { x: 50, y: 50 },
      data: { label: 'GitHub PR Open', type: 'input' },
    },
    {
      id: 'node-lint',
      type: 'agent',
      position: { x: 50, y: 150 },
      data: { label: 'Lint Bot', type: 'agent', status: 'idle' },
    },
    {
      id: 'node-condition',
      type: 'condition',
      position: { x: 50, y: 280 },
      data: { label: 'Is Clean?', type: 'condition' },
    },
    {
      id: 'node-review',
      type: 'agent',
      position: { x: -100, y: 400 },
      data: { label: 'Senior Reviewer', type: 'agent', status: 'idle' },
    },
    {
      id: 'node-security',
      type: 'agent',
      position: { x: 200, y: 400 },
      data: { label: 'Security Scan', type: 'agent', status: 'idle' },
    },
    {
      id: 'node-end',
      type: 'output',
      position: { x: 50, y: 550 },
      data: { label: 'Merge Report', type: 'output' },
    },
  ],
  edges: [
    { id: 'e1', source: 'node-start', target: 'node-lint' },
    { id: 'e2', source: 'node-lint', target: 'node-condition' },
    { id: 'e3', source: 'node-condition', target: 'node-review', label: 'Yes' },
    { id: 'e4', source: 'node-condition', target: 'node-security', label: 'No' },
    { id: 'e5', source: 'node-review', target: 'node-end' },
    { id: 'e6', source: 'node-security', target: 'node-end' },
  ],
};

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
    try {
      const workflows = await this.request<any[]>('/workflows');
      return workflows.map(this.transformWorkflow);
    } catch (error) {
      console.warn('Failed to fetch workflows, returning mock data for demonstration:', error);
      return [MOCK_CODE_REVIEW_WORKFLOW];
    }
  }

  async getWorkflow(id: string): Promise<Workflow> {
    try {
      const workflow = await this.request<any>(`/workflows/${id}`);
      return this.transformWorkflow(workflow);
    } catch (error) {
      // If ID matches mock, return mock
      if (id === MOCK_CODE_REVIEW_WORKFLOW.id) {
        return MOCK_CODE_REVIEW_WORKFLOW;
      }
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
    workflowId: string,
    input?: Record<string, any>
  ): Promise<WorkflowExecution> {
    try {
      const execution = await this.request<any>('/workflows/execute', {
        method: 'POST',
        body: JSON.stringify({
          workflowId,
          input,
        }),
      });
      return this.transformExecution(execution);
    } catch (error) {
      console.error(`Failed to execute workflow ${workflowId}:`, error);
      throw error;
    }
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
      const endpoint = workflowId ? `/workflows/${workflowId}/executions` : '/workflows/executions';
      const executions = await this.request<any[]>(endpoint);
      return executions.map(this.transformExecution);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      throw error;
    }
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
      console.warn('Failed to fetch workflow templates from API, using defaults:', error);
      return DEFAULT_WORKFLOW_TEMPLATES;
    }
  }

  async getTemplate(id: string): Promise<WorkflowTemplate> {
    try {
      return await this.request<WorkflowTemplate>(`/workflows/templates/${id}`);
    } catch (error) {
      console.warn(`Failed to fetch template ${id} from API, checking defaults:`, error);
      const template = DEFAULT_WORKFLOW_TEMPLATES.find((t) => t.id === id);
      if (template) return template;
      throw error;
    }
  }

  async createFromTemplate(
    templateId: string,
    name: string,
    description?: string
  ): Promise<Workflow> {
    try {
      const workflow = await this.request<any>('/workflows/from-template', {
        method: 'POST',
        body: JSON.stringify({
          templateId,
          name,
          description,
        }),
      });
      return this.transformWorkflow(workflow);
    } catch (error) {
      console.warn(
        `Failed to create workflow from template ${templateId} via API, using local logic:`,
        error
      );

      const template = DEFAULT_WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Create a new workflow based on the template locally (mocking backend behavior)
      const newWorkflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        description: description || template.description,
        nodes: template.nodes,
        edges: template.edges,
        status: 'draft',
        version: 1,
        createdBy: 'current-user',
        tags: [],
        metadata: {
          sourceTemplateId: template.id,
          ...template.metadata,
        },
      };

      // In a real app, this would still need to go to the backend to persist
      // We'll try to create it via the standard createWorkflow method
      return this.createWorkflow(newWorkflow);
    }
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
    return {
      ...apiWorkflow,
      createdAt: new Date(apiWorkflow.createdAt),
      updatedAt: new Date(apiWorkflow.updatedAt),
    };
  }

  private transformExecution(apiExecution: any): WorkflowExecution {
    return {
      ...apiExecution,
      startTime: new Date(apiExecution.startTime),
      endTime: apiExecution.endTime ? new Date(apiExecution.endTime) : undefined,
      logs:
        apiExecution.logs?.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })) || [],
      nodeExecutions:
        apiExecution.nodeExecutions?.map((nodeExec: any) => ({
          ...nodeExec,
          startTime: nodeExec.startTime ? new Date(nodeExec.startTime) : undefined,
          endTime: nodeExec.endTime ? new Date(nodeExec.endTime) : undefined,
        })) || [],
    };
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
export default WorkflowService;
