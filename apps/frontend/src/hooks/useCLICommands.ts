/**
 * useCLICommands Hook
 *
 * React hook for executing TNF CLI commands from the frontend.
 * Provides methods to execute all CLI commands via API calls to the backend.
 *
 * @example
 * ```tsx
 * function CLICommandCenter() {
 *   const {
 *     executeCommand,
 *     executeAgentCommand,
 *     executeTaskCommand,
 *     executeWorkflowCommand,
 *     executeConfigCommand,
 *     executeMonitoringCommand,
 *     getCommands,
 *     getCategories,
 *     getHealth,
 *     loading,
 *     error,
 *     lastResult
 *   } = useCLICommands();
 *
 *   const handleListAgents = async () => {
 *     const result = await executeAgentCommand('list', {}, { online: true });
 *     if (result) {
 *       console.log('Agents:', result.data);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleListAgents} disabled={loading}>
 *         List Online Agents
 *       </button>
 *       {loading && <Spinner />}
 *       {error && <Error message={error.message} />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @module useCLICommands
 */

import { useCallback, useRef, useState } from 'react';
import { useApi } from './useApi';
import { useToast } from './useToast';

/**
 * CLI Command Categories
 */
export type CLICategory =
  | 'agent'
  | 'task'
  | 'workflow'
  | 'config'
  | 'monitoring'
  | 'message'
  | 'conversation'
  | 'ide';

/**
 * Command execution request
 */
export interface ExecuteCommandRequest {
  /** Command category */
  category: CLICategory;
  /** Command name */
  command: string;
  /** Command arguments */
  args?: Record<string, unknown>;
  /** Command options/flags */
  options?: Record<string, unknown>;
}

/**
 * Command execution response
 */
export interface ExecuteCommandResponse {
  /** Whether the command executed successfully */
  success: boolean;
  /** Command output/result */
  data?: unknown;
  /** Error message if failed */
  error?: string;
  /** Execution timestamp */
  timestamp: string;
  /** Execution duration in milliseconds */
  duration: number;
  /** Command that was executed */
  command: string;
  /** Command category */
  category: string;
}

/**
 * CLI Command Information
 */
export interface CLICommandInfo {
  /** Command ID */
  id: string;
  /** Command name */
  name: string;
  /** Command description */
  description: string;
  /** Command category */
  category: string;
  /** Available arguments */
  args?: Array<{
    name: string;
    description: string;
    required: boolean;
    type: string;
  }>;
  /** Available options */
  options?: Array<{
    name: string;
    description: string;
    alias?: string;
    type: string;
    default?: unknown;
  }>;
}

/**
 * Agent information from CLI
 */
export interface CLIAgentInfo {
  id: string;
  name: string;
  role: string;
  platform: string;
  status: string;
  capabilities: string[];
  isOnline?: boolean;
  lastSeen?: string;
  skills?: string[];
}

/**
 * Task information from CLI
 */
export interface CLITaskInfo {
  id: string;
  title: string;
  status: string;
  assignedTo?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  createdAt: string;
}

/**
 * Task status details
 */
export interface CLITaskStatus {
  id: string;
  title: string;
  status: string;
  message?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  artifacts: Array<{
    id: string;
    name?: string;
  }>;
}

/**
 * Workflow template information
 */
export interface CLIWorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  steps: number;
}

/**
 * Health status
 */
export interface CLIHealthStatus {
  status: string;
  redis: boolean;
  timestamp: string;
}

/**
 * Hook return type
 */
export interface UseCLICommandsReturn {
  /** Execute a generic CLI command */
  executeCommand: (request: ExecuteCommandRequest) => Promise<ExecuteCommandResponse | null>;
  /** Execute an agent command */
  executeAgentCommand: (
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<ExecuteCommandResponse | null>;
  /** Execute a task command */
  executeTaskCommand: (
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<ExecuteCommandResponse | null>;
  /** Execute a workflow command */
  executeWorkflowCommand: (
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<ExecuteCommandResponse | null>;
  /** Execute a config command */
  executeConfigCommand: (
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<ExecuteCommandResponse | null>;
  /** Execute a monitoring command */
  executeMonitoringCommand: (
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<ExecuteCommandResponse | null>;
  /** Execute a message command */
  executeMessageCommand: (
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<ExecuteCommandResponse | null>;
  /** Execute a conversation command */
  executeConversationCommand: (
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<ExecuteCommandResponse | null>;
  /** Execute an IDE command */
  executeIDECommand: (
    command: string,
    args?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<ExecuteCommandResponse | null>;
  /** Get list of available commands */
  getCommands: (category?: CLICategory) => Promise<CLICommandInfo[]>;
  /** Get list of command categories */
  getCategories: () => Promise<string[]>;
  /** Get CLI health status */
  getHealth: () => Promise<CLIHealthStatus | null>;
  /** List all agents */
  listAgents: (options?: { online?: boolean; skills?: string }) => Promise<CLIAgentInfo[]>;
  /** Discover agents by skill */
  discoverAgents: (skill: string) => Promise<CLIAgentInfo[]>;
  /** Register a new agent */
  registerAgent: (
    name: string,
    role?: string,
    platform?: string,
    capabilities?: string[]
  ) => Promise<{ id: string; name: string } | null>;
  /** List tasks */
  listTasks: (options?: {
    state?: string;
    assignee?: string;
    all?: boolean;
  }) => Promise<CLITaskInfo[]>;
  /** Create a new task */
  createTask: (params: {
    title: string;
    description?: string;
    assign?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    tags?: string[];
    deadline?: string;
  }) => Promise<unknown | null>;
  /** Get task status */
  getTaskStatus: (taskId: string) => Promise<CLITaskStatus | null>;
  /** Assign task to agent */
  assignTask: (taskId: string, agentId: string) => Promise<unknown | null>;
  /** Cancel a task */
  cancelTask: (taskId: string, reason?: string) => Promise<unknown | null>;
  /** List workflow templates */
  listWorkflowTemplates: () => Promise<CLIWorkflowTemplate[]>;
  /** Execute a workflow */
  executeWorkflow: (
    workflowId: string,
    options?: { template?: boolean; vars?: Record<string, unknown> }
  ) => Promise<unknown | null>;
  /** Check system health */
  checkHealth: () => Promise<CLIHealthStatus | null>;
  /** Get task statistics */
  getTaskStats: () => Promise<{
    total: number;
    completionRate: number;
    averageCompletionTime: number;
    byState: Record<string, number>;
  } | null>;
  /** Whether a command is currently executing */
  loading: boolean;
  /** Error from the last command execution */
  error: Error | null;
  /** Result from the last command execution */
  lastResult: ExecuteCommandResponse | null;
  /** Clear the current error */
  clearError: () => void;
  /** Cancel the current command execution */
  cancel: () => void;
}

/**
 * React hook for executing TNF CLI commands
 *
 * @returns UseCLICommandsReturn - Hook methods and state
 */
export function useCLICommands(): UseCLICommandsReturn {
  const { api } = useApi();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<ExecuteCommandResponse | null>(null);

  // Use a ref to track if the current request should be cancelled
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Cancel the current command execution
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Execute a CLI command
   */
  const executeCommand = useCallback(
    async (request: ExecuteCommandRequest): Promise<ExecuteCommandResponse | null> => {
      // Cancel any existing request
      cancel();

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setLoading(true);
      setError(null);

      try {
        const response = await api.post<ExecuteCommandResponse>('/cli/execute', request, {
          signal: abortController.signal,
        });

        const result = response.data;
        setLastResult(result);

        if (!result.success) {
          const err = new Error(result.error || 'Command execution failed');
          setError(err);
          toast({
            title: 'Command Failed',
            description: err.message,
            variant: 'destructive',
          });
          return null;
        }

        return result;
      } catch (err) {
        // Don't treat abort as an error
        if ((err as Error).name === 'AbortError') {
          return null;
        }

        const error = err as Error;
        setError(error);
        toast({
          title: 'Command Error',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [api, toast, cancel]
  );

  /**
   * Execute an agent command
   */
  const executeAgentCommand = useCallback(
    async (
      command: string,
      args?: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<ExecuteCommandResponse | null> => {
      return executeCommand({
        category: 'agent',
        command,
        args,
        options,
      });
    },
    [executeCommand]
  );

  /**
   * Execute a task command
   */
  const executeTaskCommand = useCallback(
    async (
      command: string,
      args?: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<ExecuteCommandResponse | null> => {
      return executeCommand({
        category: 'task',
        command,
        args,
        options,
      });
    },
    [executeCommand]
  );

  /**
   * Execute a workflow command
   */
  const executeWorkflowCommand = useCallback(
    async (
      command: string,
      args?: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<ExecuteCommandResponse | null> => {
      return executeCommand({
        category: 'workflow',
        command,
        args,
        options,
      });
    },
    [executeCommand]
  );

  /**
   * Execute a config command
   */
  const executeConfigCommand = useCallback(
    async (
      command: string,
      args?: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<ExecuteCommandResponse | null> => {
      return executeCommand({
        category: 'config',
        command,
        args,
        options,
      });
    },
    [executeCommand]
  );

  /**
   * Execute a monitoring command
   */
  const executeMonitoringCommand = useCallback(
    async (
      command: string,
      args?: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<ExecuteCommandResponse | null> => {
      return executeCommand({
        category: 'monitoring',
        command,
        args,
        options,
      });
    },
    [executeCommand]
  );

  /**
   * Execute a message command
   */
  const executeMessageCommand = useCallback(
    async (
      command: string,
      args?: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<ExecuteCommandResponse | null> => {
      return executeCommand({
        category: 'message',
        command,
        args,
        options,
      });
    },
    [executeCommand]
  );

  /**
   * Execute a conversation command
   */
  const executeConversationCommand = useCallback(
    async (
      command: string,
      args?: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<ExecuteCommandResponse | null> => {
      return executeCommand({
        category: 'conversation',
        command,
        args,
        options,
      });
    },
    [executeCommand]
  );

  /**
   * Execute an IDE command
   */
  const executeIDECommand = useCallback(
    async (
      command: string,
      args?: Record<string, unknown>,
      options?: Record<string, unknown>
    ): Promise<ExecuteCommandResponse | null> => {
      return executeCommand({
        category: 'ide',
        command,
        args,
        options,
      });
    },
    [executeCommand]
  );

  /**
   * Get list of available commands
   */
  const getCommands = useCallback(
    async (category?: CLICategory): Promise<CLICommandInfo[]> => {
      try {
        const url = category ? `/cli/commands?category=${category}` : '/cli/commands';
        const response = await api.get<CLICommandInfo[]>(url);
        return response.data;
      } catch (err) {
        toast({
          title: 'Failed to load commands',
          description: (err as Error).message,
          variant: 'destructive',
        });
        return [];
      }
    },
    [api, toast]
  );

  /**
   * Get list of command categories
   */
  const getCategories = useCallback(async (): Promise<string[]> => {
    try {
      const response = await api.get<string[]>('/cli/categories');
      return response.data;
    } catch (err) {
      toast({
        title: 'Failed to load categories',
        description: (err as Error).message,
        variant: 'destructive',
      });
      return [];
    }
  }, [api, toast]);

  /**
   * Get CLI health status
   */
  const getHealth = useCallback(async (): Promise<CLIHealthStatus | null> => {
    try {
      const response = await api.get<CLIHealthStatus>('/cli/health');
      return response.data;
    } catch (err) {
      toast({
        title: 'Health check failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
      return null;
    }
  }, [api, toast]);

  /**
   * List all agents
   */
  const listAgents = useCallback(
    async (options?: { online?: boolean; skills?: string }): Promise<CLIAgentInfo[]> => {
      const result = await executeAgentCommand('list', {}, options);
      return (result?.data as CLIAgentInfo[]) || [];
    },
    [executeAgentCommand]
  );

  /**
   * Discover agents by skill
   */
  const discoverAgents = useCallback(
    async (skill: string): Promise<CLIAgentInfo[]> => {
      const result = await executeAgentCommand('discover', { skill });
      return (result?.data as CLIAgentInfo[]) || [];
    },
    [executeAgentCommand]
  );

  /**
   * Register a new agent
   */
  const registerAgent = useCallback(
    async (
      name: string,
      role?: string,
      platform?: string,
      capabilities?: string[]
    ): Promise<{ id: string; name: string } | null> => {
      const result = await executeAgentCommand('register', {
        name,
        role,
        platform,
        capabilities,
      });
      return result?.data as { id: string; name: string } | null;
    },
    [executeAgentCommand]
  );

  /**
   * List tasks
   */
  const listTasks = useCallback(
    async (options?: {
      state?: string;
      assignee?: string;
      all?: boolean;
    }): Promise<CLITaskInfo[]> => {
      const result = await executeTaskCommand('list', {}, options);
      return (result?.data as CLITaskInfo[]) || [];
    },
    [executeTaskCommand]
  );

  /**
   * Create a new task
   */
  const createTask = useCallback(
    async (params: {
      title: string;
      description?: string;
      assign?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      tags?: string[];
      deadline?: string;
    }): Promise<unknown | null> => {
      const result = await executeTaskCommand(
        'create',
        { title: params.title },
        {
          description: params.description,
          assign: params.assign,
          priority: params.priority,
          tags: params.tags?.join(','),
          deadline: params.deadline,
        }
      );
      return result?.data || null;
    },
    [executeTaskCommand]
  );

  /**
   * Get task status
   */
  const getTaskStatus = useCallback(
    async (taskId: string): Promise<CLITaskStatus | null> => {
      const result = await executeTaskCommand('status', { taskId });
      return result?.data as CLITaskStatus | null;
    },
    [executeTaskCommand]
  );

  /**
   * Assign task to agent
   */
  const assignTask = useCallback(
    async (taskId: string, agentId: string): Promise<unknown | null> => {
      const result = await executeTaskCommand('assign', { taskId, agentId });
      return result?.data || null;
    },
    [executeTaskCommand]
  );

  /**
   * Cancel a task
   */
  const cancelTask = useCallback(
    async (taskId: string, reason?: string): Promise<unknown | null> => {
      const result = await executeTaskCommand('cancel', { taskId }, { reason });
      return result?.data || null;
    },
    [executeTaskCommand]
  );

  /**
   * List workflow templates
   */
  const listWorkflowTemplates = useCallback(async (): Promise<CLIWorkflowTemplate[]> => {
    const result = await executeWorkflowCommand('templates');
    return (result?.data as CLIWorkflowTemplate[]) || [];
  }, [executeWorkflowCommand]);

  /**
   * Execute a workflow
   */
  const executeWorkflow = useCallback(
    async (
      workflowId: string,
      options?: { template?: boolean; vars?: Record<string, unknown> }
    ): Promise<unknown | null> => {
      const result = await executeWorkflowCommand('orchestrate', { workflow: workflowId }, options);
      return result?.data || null;
    },
    [executeWorkflowCommand]
  );

  /**
   * Check system health
   */
  const checkHealth = useCallback(async (): Promise<CLIHealthStatus | null> => {
    const result = await executeMonitoringCommand('health');
    return result?.data as CLIHealthStatus | null;
  }, [executeMonitoringCommand]);

  /**
   * Get task statistics
   */
  const getTaskStats = useCallback(async (): Promise<{
    total: number;
    completionRate: number;
    averageCompletionTime: number;
    byState: Record<string, number>;
  } | null> => {
    const result = await executeMonitoringCommand('stats');
    return result?.data as {
      total: number;
      completionRate: number;
      averageCompletionTime: number;
      byState: Record<string, number>;
    } | null;
  }, [executeMonitoringCommand]);

  return {
    executeCommand,
    executeAgentCommand,
    executeTaskCommand,
    executeWorkflowCommand,
    executeConfigCommand,
    executeMonitoringCommand,
    executeMessageCommand,
    executeConversationCommand,
    executeIDECommand,
    getCommands,
    getCategories,
    getHealth,
    listAgents,
    discoverAgents,
    registerAgent,
    listTasks,
    createTask,
    getTaskStatus,
    assignTask,
    cancelTask,
    listWorkflowTemplates,
    executeWorkflow,
    checkHealth,
    getTaskStats,
    loading,
    error,
    lastResult,
    clearError,
    cancel,
  };
}

export default useCLICommands;
