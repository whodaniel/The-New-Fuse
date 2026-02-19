/**
 * Complete MCP Server Implementation for The New Fuse
 * Provides Model Context Protocol server for AI agency platform capabilities
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequest,
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Mock services interface (will be replaced with actual services in production)
interface ServiceInterface {
  agent?: any;
  chat?: any;
  workflow?: any;
  monitoring?: any;
  claudeDev?: any;
  agentGrants?: any;
}

/**
 * The New Fuse MCP Server
 * Provides comprehensive AI agency platform capabilities via MCP
 */
export class TheNewFuseMCPServer {
  private server: Server;
  private isRemote: boolean;
  private services: ServiceInterface = {};

  constructor(isRemote: boolean = false) {
    this.isRemote = isRemote;
    this.server = new Server(
      {
        name: 'the-new-fuse',
        version: '2.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  /**
   * Set service implementations
   */
  setServices(services: ServiceInterface) {
    this.services = services;
  }

  /**
   * Setup all MCP tool handlers
   */
  private setupToolHandlers() {
    // Agent Management Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Agent Management
        {
          name: 'list_agents',
          description: 'List all agents in the platform',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['active', 'inactive', 'all'], default: 'all' },
              category: { type: 'string', description: 'Filter by agent category' },
            },
          },
        },
        {
          name: 'create_agent',
          description: 'Create a new agent',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Agent name' },
              type: { type: 'string', description: 'Agent type/category' },
              config: { type: 'object', description: 'Agent configuration' },
            },
            required: ['name', 'type'],
          },
        },
        {
          name: 'get_agent_status',
          description: 'Get detailed status of an agent',
          inputSchema: {
            type: 'object',
            properties: {
              agentId: { type: 'string', description: 'Agent ID' },
            },
            required: ['agentId'],
          },
        },

        // Chat Management
        {
          name: 'list_chat_rooms',
          description: 'List all chat rooms',
          inputSchema: {
            type: 'object',
            properties: {
              active: { type: 'boolean', description: 'Filter by active status' },
            },
          },
        },
        {
          name: 'create_chat_room',
          description: 'Create a new chat room',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Chat room name' },
              participants: {
                type: 'array',
                items: { type: 'string' },
                description: 'Participant IDs',
              },
            },
            required: ['name'],
          },
        },
        {
          name: 'send_message',
          description: 'Send a message to a chat room',
          inputSchema: {
            type: 'object',
            properties: {
              roomId: { type: 'string', description: 'Chat room ID' },
              message: { type: 'string', description: 'Message content' },
              sender: { type: 'string', description: 'Sender ID' },
            },
            required: ['roomId', 'message', 'sender'],
          },
        },

        // Workflow Management
        {
          name: 'list_workflows',
          description: 'List all workflows',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['running', 'completed', 'failed', 'all'],
                default: 'all',
              },
            },
          },
        },
        {
          name: 'create_workflow',
          description: 'Create a new workflow',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Workflow name' },
              steps: { type: 'array', description: 'Workflow steps' },
              trigger: { type: 'object', description: 'Workflow trigger configuration' },
            },
            required: ['name', 'steps'],
          },
        },
        {
          name: 'execute_workflow',
          description: 'Execute a workflow',
          inputSchema: {
            type: 'object',
            properties: {
              workflowId: { type: 'string', description: 'Workflow ID' },
              parameters: { type: 'object', description: 'Execution parameters' },
            },
            required: ['workflowId'],
          },
        },

        // Automation Templates
        {
          name: 'list_automation_templates',
          description: 'List available automation templates',
          inputSchema: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Template category' },
            },
          },
        },
        {
          name: 'create_automation_from_template',
          description: 'Create automation from template',
          inputSchema: {
            type: 'object',
            properties: {
              templateId: { type: 'string', description: 'Template ID' },
              name: { type: 'string', description: 'Automation name' },
              parameters: { type: 'object', description: 'Template parameters' },
            },
            required: ['templateId', 'name'],
          },
        },

        // Platform Monitoring
        {
          name: 'get_platform_stats',
          description: 'Get comprehensive platform statistics',
          inputSchema: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['hour', 'day', 'week', 'month'], default: 'day' },
            },
          },
        },
        {
          name: 'get_system_health',
          description: 'Get system health status',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },

        // Task Management
        {
          name: 'list_tasks',
          description: 'List all tasks in the system',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['pending', 'running', 'completed', 'failed', 'all'],
                default: 'all',
              },
              agentId: { type: 'string', description: 'Filter by agent ID' },
            },
          },
        },
        {
          name: 'create_task',
          description: 'Create a new task',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Task title' },
              description: { type: 'string', description: 'Task description' },
              agentId: { type: 'string', description: 'Assigned agent ID' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
            },
            required: ['title', 'description'],
          },
        },

        // Agent Delegate / LLM Proxy
        {
          name: 'delegate_llm_request',
          description:
            'Securely proxy an LLM request using a delegated grant token. Enforces rate limits, token budgets, and cost caps.',
          inputSchema: {
            type: 'object',
            properties: {
              provider: { type: 'string', description: 'LLM Provider (e.g. openai, anthropic)' },
              grantToken: { type: 'string', description: 'The delegated agent grant token' },
              payload: {
                type: 'object',
                description: 'The standard completion/chat payload for the target provider',
              },
            },
            required: ['provider', 'grantToken', 'payload'],
          },
        },

        // Agent Knowledge Banks (Definitions & Skills)
        {
          name: 'get_agent_bank_resources',
          description:
            'Access the core bank of agent definitions (.agent/agents, .claude/agents) and skills (.agent/skills). This allows discovery of persona templates and capabilities.',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['list', 'read'],
                description: 'Action to perform: list or read',
              },
              resourceType: {
                type: 'string',
                enum: ['agents', 'skills'],
                description: 'Type of resource to access',
              },
              bank: {
                type: 'string',
                enum: ['tnf', 'claude', 'all'],
                default: 'all',
                description: 'Primary source bank to query',
              },
              filePath: {
                type: 'string',
                description: 'Relative path of the file to read (within the bank directory)',
              },
            },
            required: ['action', 'resourceType'],
          },
        },
      ] as Tool[],
    }));

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Agent Management
          case 'list_agents':
            return await this.handleListAgents(args);
          case 'create_agent':
            return await this.handleCreateAgent(args);
          case 'get_agent_status':
            return await this.handleGetAgentStatus(args);

          // Chat Management
          case 'list_chat_rooms':
            return await this.handleListChatRooms(args);
          case 'create_chat_room':
            return await this.handleCreateChatRoom(args);
          case 'send_message':
            return await this.handleSendMessage(args);

          // Workflow Management
          case 'list_workflows':
            return await this.handleListWorkflows(args);
          case 'create_workflow':
            return await this.handleCreateWorkflow(args);
          case 'execute_workflow':
            return await this.handleExecuteWorkflow(args);

          // Automation Templates
          case 'list_automation_templates':
            return await this.handleListAutomationTemplates(args);
          case 'create_automation_from_template':
            return await this.handleCreateAutomationFromTemplate(args);

          // Platform Monitoring
          case 'get_platform_stats':
            return await this.handleGetPlatformStats(args);
          case 'get_system_health':
            return await this.handleGetSystemHealth(args);

          // Task Management
          case 'list_tasks':
            return await this.handleListTasks(args);
          case 'create_task':
            return await this.handleCreateTask(args);

          // Agent Delegate
          case 'delegate_llm_request':
            return await this.handleDelegateLlmRequest(args);

          // Agent Knowledge Bank
          case 'get_agent_bank_resources':
            return await this.handleGetAgentBankResources(args);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  // Agent Management Handlers
  private async handleListAgents(args: any) {
    if (this.services.agent) {
      return await this.services.agent.listAgents(args);
    }

    // Mock implementation
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              agents: [
                { id: 'agent-1', name: 'Director Agent', type: 'director', status: 'active' },
                { id: 'agent-2', name: 'Chat Agent', type: 'chat', status: 'active' },
                { id: 'agent-3', name: 'Workflow Agent', type: 'workflow', status: 'inactive' },
              ],
              total: 3,
              filtered: args?.status === 'active' ? 2 : 3,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleCreateAgent(args: any) {
    if (this.services.agent) {
      return await this.services.agent.createAgent(args);
    }

    const agentId = `agent-${Date.now()}`;
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: agentId,
              name: args.name,
              type: args.type,
              status: 'creating',
              config: args.config || {},
              created: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleGetAgentStatus(args: any) {
    if (this.services.agent) {
      return await this.services.agent.getAgentStatus(args.agentId);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: args.agentId,
              status: 'active',
              health: 'healthy',
              tasks: {
                pending: 2,
                running: 1,
                completed: 15,
              },
              metrics: {
                uptime: '5d 12h 30m',
                cpu_usage: '15%',
                memory_usage: '230MB',
              },
              last_activity: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Chat Management Handlers
  private async handleListChatRooms(args: any) {
    if (this.services.chat) {
      return await this.services.chat.listRooms(args);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              rooms: [
                { id: 'room-1', name: 'General Discussion', participants: 5, active: true },
                { id: 'room-2', name: 'Agent Coordination', participants: 3, active: true },
                { id: 'room-3', name: 'Project Alpha', participants: 2, active: false },
              ],
              total: 3,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleCreateChatRoom(args: any) {
    if (this.services.chat) {
      return await this.services.chat.createRoom(args);
    }

    const roomId = `room-${Date.now()}`;
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: roomId,
              name: args.name,
              participants: args.participants || [],
              created: new Date().toISOString(),
              active: true,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleSendMessage(args: any) {
    if (this.services.chat) {
      return await this.services.chat.sendMessage(args);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              messageId: `msg-${Date.now()}`,
              roomId: args.roomId,
              sender: args.sender,
              message: args.message,
              timestamp: new Date().toISOString(),
              delivered: true,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Workflow Management Handlers
  private async handleListWorkflows(args: any) {
    if (this.services.workflow) {
      return await this.services.workflow.listWorkflows(args);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              workflows: [
                { id: 'wf-1', name: 'User Onboarding', status: 'active', executions: 25 },
                { id: 'wf-2', name: 'Data Processing', status: 'running', executions: 150 },
                { id: 'wf-3', name: 'Report Generation', status: 'completed', executions: 5 },
              ],
              total: 3,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleCreateWorkflow(args: any) {
    if (this.services.workflow) {
      return await this.services.workflow.createWorkflow(args);
    }

    const workflowId = `wf-${Date.now()}`;
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: workflowId,
              name: args.name,
              steps: args.steps,
              trigger: args.trigger,
              status: 'created',
              created: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleExecuteWorkflow(args: any) {
    if (this.services.workflow) {
      return await this.services.workflow.executeWorkflow(args.workflowId, args.parameters);
    }

    const executionId = `exec-${Date.now()}`;
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              executionId,
              workflowId: args.workflowId,
              status: 'running',
              parameters: args.parameters || {},
              started: new Date().toISOString(),
              progress: '0%',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Automation Template Handlers
  private async handleListAutomationTemplates(args: any) {
    if (this.services.claudeDev) {
      return await this.services.claudeDev.listTemplates(args?.category);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              templates: [
                {
                  id: 'template-1',
                  name: 'Code Review Automation',
                  category: 'development',
                  description: 'Automated code review process',
                  parameters: ['repository', 'branch', 'reviewers'],
                },
                {
                  id: 'template-2',
                  name: 'Customer Support Flow',
                  category: 'support',
                  description: 'Automated customer support workflow',
                  parameters: ['priority', 'category', 'assignee'],
                },
                {
                  id: 'template-3',
                  name: 'Data Backup Process',
                  category: 'operations',
                  description: 'Automated data backup and verification',
                  parameters: ['source', 'destination', 'schedule'],
                },
              ],
              total: 3,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleCreateAutomationFromTemplate(args: any) {
    if (this.services.claudeDev) {
      return await this.services.claudeDev.createAutomationFromTemplate(args);
    }

    const automationId = `auto-${Date.now()}`;
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: automationId,
              name: args.name,
              templateId: args.templateId,
              parameters: args.parameters || {},
              status: 'created',
              created: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Platform Monitoring Handlers
  private async handleGetPlatformStats(args: any) {
    if (this.services.monitoring) {
      return await this.services.monitoring.getPlatformStats(args);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              period: args?.period || 'day',
              stats: {
                users: {
                  total_users: 150,
                  active_users: 85,
                  new_users: 12,
                },
                workflows: {
                  total_workflows: 45,
                  executed_workflows: 230,
                  success_rate: 0.94,
                },
                chat: {
                  messages_sent: 1520,
                  rooms_created: 8,
                  active_conversations: 23,
                },
                agents: {
                  total_agents: 18,
                  active_agents: 12,
                  tasks_completed: 156,
                },
              },
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleGetSystemHealth(_args: any) {
    if (this.services.monitoring) {
      return await this.services.monitoring.getSystemHealth();
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              overall_status: 'healthy',
              services: {
                database: { status: 'healthy', response_time: '15ms' },
                redis: { status: 'healthy', response_time: '8ms' },
                mcp_server: { status: 'healthy', response_time: '12ms' },
                api_server: { status: 'healthy', response_time: '45ms' },
              },
              system: {
                cpu_usage: '25%',
                memory_usage: '1.2GB / 4GB',
                disk_usage: '45GB / 100GB',
                uptime: '7d 14h 22m',
              },
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Task Management Handlers
  private async handleListTasks(args: any) {
    if (this.services.agent) {
      return await this.services.agent.listTasks(args);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tasks: [
                {
                  id: 'task-1',
                  title: 'Process customer feedback',
                  status: 'running',
                  agentId: 'agent-1',
                  priority: 'high',
                  created: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                  id: 'task-2',
                  title: 'Generate weekly report',
                  status: 'pending',
                  agentId: 'agent-2',
                  priority: 'medium',
                  created: new Date(Date.now() - 1800000).toISOString(),
                },
                {
                  id: 'task-3',
                  title: 'Update documentation',
                  status: 'completed',
                  agentId: 'agent-3',
                  priority: 'low',
                  created: new Date(Date.now() - 7200000).toISOString(),
                },
              ],
              total: 3,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleCreateTask(args: any) {
    if (this.services.agent) {
      return await this.services.agent.createTask(args);
    }

    const taskId = `task-${Date.now()}`;
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: taskId,
              title: args.title,
              description: args.description,
              agentId: args.agentId,
              priority: args.priority || 'medium',
              status: 'pending',
              created: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Agent Delegate Handlers
  private async handleDelegateLlmRequest(args: any) {
    if (this.services.agentGrants) {
      const { provider, grantToken, payload } = args;
      try {
        const result = await this.services.agentGrants.proxy(provider, grantToken, payload);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        throw new McpError(
          ErrorCode.InternalError,
          `LLM Delegation Failed: ${error.message || String(error)}`
        );
      }
    }

    throw new McpError(ErrorCode.InternalError, 'Agent Grants Service not initialized');
  }

  // Agent Knowledge Bank Handlers
  private async handleGetAgentBankResources(args: any) {
    const { action, resourceType, bank = 'all', filePath } = args;
    const root = this.getWorkspaceRoot();

    const paths: string[] = [];
    if (resourceType === 'agents') {
      if (bank === 'tnf' || bank === 'all') paths.push(path.join(root, '.agent', 'agents'));
      if (bank === 'claude' || bank === 'all') paths.push(path.join(root, '.claude', 'agents'));
    } else if (resourceType === 'skills') {
      if (bank === 'tnf' || bank === 'all') paths.push(path.join(root, '.agent', 'skills'));
      // Claude bank skills often reside in the same .agent folder but with different naming or separate subfolders
      if (bank === 'claude') paths.push(path.join(root, '.agent', 'skills'));
    }

    if (action === 'list') {
      const results: any[] = [];
      for (const p of paths) {
        if (fs.existsSync(p)) {
          const files = fs.readdirSync(p);
          results.push({
            bankPath: p.replace(root, ''),
            files: files.map((f) => {
              const stat = fs.statSync(path.join(p, f));
              return {
                name: f,
                isDir: stat.isDirectory(),
                size: stat.size,
              };
            }),
          });
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ resourceType, action, banks: results }, null, 2),
          },
        ],
      };
    } else if (action === 'read') {
      if (!filePath) {
        throw new McpError(ErrorCode.InvalidParams, 'filePath is required for read action');
      }

      // Try to find the file in any of the valid bank paths
      for (const p of paths) {
        const fullPath = path.join(p, filePath);
        // Simple security check to prevent directory traversal
        if (!fullPath.startsWith(p)) continue;

        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          return {
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          };
        }
      }

      throw new McpError(ErrorCode.InvalidParams, `File not found: ${filePath}`);
    }

    throw new McpError(ErrorCode.MethodNotFound, `Action ${action} not supported`);
  }

  /**
   * Resolve the workspace root directory
   */
  private getWorkspaceRoot(): string {
    if (process.env.TNF_WORKSPACE) return process.env.TNF_WORKSPACE;

    // Default to current directory and look for .agent
    let current = process.cwd();
    // Safety limit of 10 levels
    for (let i = 0; i < 10; i++) {
      if (fs.existsSync(path.join(current, '.agent'))) {
        return current;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }

    // Fallback to searching for package.json in root if .agent is missing
    return process.cwd();
  }

  /**
   * Start the MCP server
   */
  async start(transport: 'stdio' | 'http' = 'stdio', port?: number) {
    if (transport === 'stdio') {
      const stdinTransport = new StdioServerTransport();
      await this.server.connect(stdinTransport);
      console.error('The New Fuse MCP Server running on stdio');
    } else if (transport === 'http') {
      const app = express();
      app.use(express.json());

      const httpPort = port || 3001;
      const httpServer = app.listen(httpPort, () => {
        console.error(`The New Fuse MCP Server running on http://localhost:${httpPort}`);
      });

      const transport = new SSEServerTransport('/message', httpServer as any);
      await this.server.connect(transport);
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    await this.server.close();
  }
}
