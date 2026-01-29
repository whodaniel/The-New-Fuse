/**
 * MCP Server for KIMI Orchestrator
 *
 * Provides Model Context Protocol (MCP) tools for Kilo Code integration.
 * Exposes agent management, task distribution, and monitoring capabilities.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { MCP_TOOL_NAMES } from './constants';
import { KimiOrchestrator } from './KimiOrchestrator';

import type { KimiCapability } from './types';

/**
 * MCP Server class for KIMI Orchestrator
 */
export class KimiMcpServer {
  private server: Server;
  private orchestrator: KimiOrchestrator;
  private transport?: StdioServerTransport;

  constructor(orchestrator?: KimiOrchestrator) {
    this.orchestrator = orchestrator || new KimiOrchestrator();

    this.server = new Server(
      {
        name: 'kimi-orchestrator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Set up MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return this.handleToolCall(request.params.name, request.params.arguments);
    });
  }

  /**
   * Get list of available MCP tools
   */
  private getTools(): Tool[] {
    return [
      {
        name: MCP_TOOL_NAMES.REGISTER_AGENT,
        description: 'Register a new KIMI agent with the orchestrator',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'Unique identifier for the agent',
            },
            capabilities: {
              type: 'array',
              items: { type: 'string' },
              description:
                'List of agent capabilities (e.g., code-generation, debugging, typescript)',
            },
            metadata: {
              type: 'object',
              description: 'Optional metadata for the agent',
            },
          },
          required: ['agentId', 'capabilities'],
        },
      },
      {
        name: MCP_TOOL_NAMES.UNREGISTER_AGENT,
        description: 'Unregister an agent from the orchestrator',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'ID of the agent to unregister',
            },
          },
          required: ['agentId'],
        },
      },
      {
        name: MCP_TOOL_NAMES.ASSIGN_TASK,
        description: 'Submit a task for execution by the agent fleet',
        inputSchema: {
          type: 'object',
          properties: {
            taskType: {
              type: 'string',
              description: 'Type of task (e.g., code-review, refactoring, documentation)',
            },
            payload: {
              type: 'object',
              description: 'Task payload containing task-specific data',
            },
            requiredCapabilities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Capabilities required to execute this task',
            },
            priority: {
              type: 'number',
              description: 'Task priority (1-10, higher = more important)',
              minimum: 1,
              maximum: 10,
            },
            timeoutMs: {
              type: 'number',
              description: 'Task timeout in milliseconds',
            },
          },
          required: ['taskType', 'payload'],
        },
      },
      {
        name: MCP_TOOL_NAMES.GET_AGENT_STATUS,
        description: 'Get detailed status of a specific agent',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'ID of the agent to query',
            },
          },
          required: ['agentId'],
        },
      },
      {
        name: MCP_TOOL_NAMES.GET_POOL_STATS,
        description: 'Get statistics about the agent pool',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: MCP_TOOL_NAMES.LIST_AGENTS,
        description: 'List all registered agents',
        inputSchema: {
          type: 'object',
          properties: {
            capability: {
              type: 'string',
              description: 'Filter agents by specific capability',
            },
          },
        },
      },
      {
        name: MCP_TOOL_NAMES.CANCEL_TASK,
        description: 'Cancel a pending task',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'ID of the task to cancel',
            },
          },
          required: ['taskId'],
        },
      },
      {
        name: MCP_TOOL_NAMES.DECOMPOSE_TASK,
        description: 'Decompose a complex task into subtasks',
        inputSchema: {
          type: 'object',
          properties: {
            taskType: {
              type: 'string',
              description: 'Type of task to decompose',
            },
            payload: {
              type: 'object',
              description: 'Task payload',
            },
            strategy: {
              type: 'string',
              enum: ['parallel', 'sequential', 'dag'],
              description: 'Decomposition strategy',
            },
          },
          required: ['taskType', 'payload'],
        },
      },
    ];
  }

  /**
   * Handle tool call requests
   */
  private async handleToolCall(
    name: string,
    args: Record<string, unknown> | undefined
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    try {
      switch (name) {
        case MCP_TOOL_NAMES.REGISTER_AGENT:
          return await this.handleRegisterAgent(args);
        case MCP_TOOL_NAMES.UNREGISTER_AGENT:
          return await this.handleUnregisterAgent(args);
        case MCP_TOOL_NAMES.ASSIGN_TASK:
          return await this.handleAssignTask(args);
        case MCP_TOOL_NAMES.GET_AGENT_STATUS:
          return await this.handleGetAgentStatus(args);
        case MCP_TOOL_NAMES.GET_POOL_STATS:
          return await this.handleGetPoolStats();
        case MCP_TOOL_NAMES.LIST_AGENTS:
          return await this.handleListAgents(args);
        case MCP_TOOL_NAMES.CANCEL_TASK:
          return await this.handleCancelTask(args);
        case MCP_TOOL_NAMES.DECOMPOSE_TASK:
          return await this.handleDecomposeTask(args);
        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true,
      };
    }
  }

  /**
   * Handle register_agent tool call
   */
  private async handleRegisterAgent(
    args: Record<string, unknown> | undefined
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    if (!args?.agentId || !args?.capabilities) {
      return {
        content: [{ type: 'text', text: 'Error: agentId and capabilities are required' }],
      };
    }

    const result = await this.orchestrator.registerAgent(
      args.agentId as string,
      args.capabilities as KimiCapability[],
      (args.metadata as Record<string, unknown>) || {}
    );

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `Agent ${args.agentId} registered successfully.\nCapabilities: ${(args.capabilities as string[]).join(', ')}`,
          },
        ],
      };
    }
    return {
      content: [{ type: 'text', text: `Failed to register agent: ${result.error}` }],
      isError: true,
    };
  }

  /**
   * Handle unregister_agent tool call
   */
  private async handleUnregisterAgent(
    args: Record<string, unknown> | undefined
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    if (!args?.agentId) {
      return {
        content: [{ type: 'text', text: 'Error: agentId is required' }],
      };
    }

    const result = await this.orchestrator.unregisterAgent(args.agentId as string);

    if (result.success) {
      return {
        content: [{ type: 'text', text: `Agent ${args.agentId} unregistered successfully` }],
      };
    }
    return {
      content: [{ type: 'text', text: `Failed to unregister agent: ${result.error}` }],
      isError: true,
    };
  }

  /**
   * Handle assign_task tool call
   */
  private async handleAssignTask(
    args: Record<string, unknown> | undefined
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    if (!args?.taskType || !args?.payload) {
      return {
        content: [{ type: 'text', text: 'Error: taskType and payload are required' }],
      };
    }

    const result = await this.orchestrator.submitTask(args.taskType as string, args.payload, {
      requiredCapabilities: args.requiredCapabilities as KimiCapability[] | undefined,
      priority: args.priority as number | undefined,
      timeoutMs: args.timeoutMs as number | undefined,
    });

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `Task assigned successfully!\nTask ID: ${result.data?.id}\nAssigned to: ${result.data?.agentId || 'queued'}`,
          },
        ],
      };
    }
    return {
      content: [{ type: 'text', text: `Failed to assign task: ${result.error}` }],
      isError: true,
    };
  }

  /**
   * Handle get_agent_status tool call
   */
  private async handleGetAgentStatus(
    args: Record<string, unknown> | undefined
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    if (!args?.agentId) {
      return {
        content: [{ type: 'text', text: 'Error: agentId is required' }],
      };
    }

    const agent = this.orchestrator.getAgent(args.agentId as string);

    if (!agent) {
      return {
        content: [{ type: 'text', text: `Agent ${args.agentId} not found` }],
        isError: true,
      };
    }

    const status = `
Agent: ${agent.id}
Status: ${agent.status}
Health: ${agent.health}
Capabilities: ${agent.capabilities.join(', ')}
Load: ${agent.load}%
Running Tasks: ${agent.runningTasks}
Tasks Completed: ${agent.tasksCompleted}
Average Response Time: ${agent.averageResponseTime.toFixed(0)}ms
Last Seen: ${agent.lastSeen}
    `.trim();

    return {
      content: [{ type: 'text', text: status }],
    };
  }

  /**
   * Handle get_pool_stats tool call
   */
  private async handleGetPoolStats(): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    const stats = this.orchestrator.getStats();
    const healthSummary = this.orchestrator.getHealthSummary();

    const report = `
Agent Pool Statistics:
======================
Total Agents: ${stats.totalAgents}
Active Agents: ${stats.activeAgents}
Healthy: ${healthSummary.healthy}
Degraded: ${healthSummary.degraded}
Unhealthy: ${healthSummary.unhealthy}
Offline: ${healthSummary.offline}

Task Statistics:
================
Total Tasks Processed: ${stats.totalTasksProcessed}
Running Tasks: ${stats.runningTasks}
Queued Tasks: ${stats.queuedTasks}
Average Completion Time: ${stats.averageCompletionTimeMs.toFixed(0)}ms
Pool Utilization: ${stats.utilizationPercent.toFixed(1)}%
    `.trim();

    return {
      content: [{ type: 'text', text: report }],
    };
  }

  /**
   * Handle list_agents tool call
   */
  private async handleListAgents(
    args: Record<string, unknown> | undefined
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    let agents;
    if (args?.capability) {
      agents = this.orchestrator.getAgentsByCapability(args.capability as KimiCapability);
    } else {
      agents = this.orchestrator.getAllAgents();
    }

    if (agents.length === 0) {
      return {
        content: [{ type: 'text', text: 'No agents found' }],
      };
    }

    const list = agents
      .map(
        (agent) =>
          `- ${agent.id} (${agent.health}) - Load: ${agent.load}% - Tasks: ${agent.runningTasks}/${agent.maxConcurrentTasks}`
      )
      .join('\n');

    return {
      content: [{ type: 'text', text: `Registered Agents:\n${list}` }],
    };
  }

  /**
   * Handle cancel_task tool call
   */
  private async handleCancelTask(
    args: Record<string, unknown> | undefined
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    if (!args?.taskId) {
      return {
        content: [{ type: 'text', text: 'Error: taskId is required' }],
      };
    }

    const cancelled = this.orchestrator.cancelTask(args.taskId as string);

    if (cancelled) {
      return {
        content: [{ type: 'text', text: `Task ${args.taskId} cancelled successfully` }],
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: `Failed to cancel task ${args.taskId} - task may already be running or completed`,
        },
      ],
      isError: true,
    };
  }

  /**
   * Handle decompose_task tool call
   */
  private async handleDecomposeTask(
    args: Record<string, unknown> | undefined
  ): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
    if (!args?.taskType || !args?.payload) {
      return {
        content: [{ type: 'text', text: 'Error: taskType and payload are required' }],
      };
    }

    const result = await this.orchestrator.decomposeTask(
      args.taskType as string,
      args.payload,
      (args.strategy as 'parallel' | 'sequential' | 'dag') || 'parallel'
    );

    if (result.success && result.data) {
      const subtasks = result.data.subtasks.map((st) => `  - ${st.id}: ${st.type}`).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Task decomposed successfully!\n\nOriginal Task: ${result.data.originalTask.id}\nSubtasks (${result.data.subtasks.length}):\n${subtasks}\n\nEstimated Completion Time: ${result.data.estimatedCompletionTimeMs}ms`,
          },
        ],
      };
    }
    return {
      content: [{ type: 'text', text: `Failed to decompose task: ${result.error}` }],
      isError: true,
    };
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);

    // Start the orchestrator
    await this.orchestrator.start();

    console.error('KIMI Orchestrator MCP Server started');
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    await this.orchestrator.stop();
    await this.server.close();
    console.error('KIMI Orchestrator MCP Server stopped');
  }
}

/**
 * Main entry point for running as standalone MCP server
 */
async function main(): Promise<void> {
  const server = new KimiMcpServer();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });

  await server.start();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };
