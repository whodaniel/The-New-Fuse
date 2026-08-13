// @ts-nocheck
/**
 * Complete MCP Server Implementation for The New Fuse
 * Provides Model Context Protocol server for AI agency platform capabilities
 */

import { Server } from '@modelcontextprotocol/sdk/server';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequest,
  CallToolRequestSchema,
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import * as fs from 'fs';
import * as path from 'path';

// import { WebScrapingMCPTools } from '@the-new-fuse/web-scraping';
import { JulesClient } from '@the-new-fuse/jules-skill';

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
  private webScrapingTools: any;
  private julesClient: any;

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
          resources: {},
          prompts: {},
        },
      }
    );

    // Initialize supplemental tool classes
    // this.webScrapingTools = new WebScrapingMCPTools();
    this.julesClient = new JulesClient();

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
            'Securely proxy an LLM request using a delegated grant token. Supports fixed provider mode or adaptive routing by target (centralized active/fallback policy).',
          inputSchema: {
            type: 'object',
            properties: {
              provider: {
                type: 'string',
                description:
                  'LLM Provider for fixed mode (e.g. openai, anthropic). Optional if target is provided.',
              },
              target: {
                type: 'string',
                description:
                  'Adaptive routing target (e.g. zeroclaw-sandbox). If set, centralized routing policy is used.',
              },
              grantToken: { type: 'string', description: 'The delegated agent grant token' },
              payload: {
                type: 'object',
                description: 'The standard completion/chat payload for the target provider',
              },
            },
            required: ['grantToken', 'payload'],
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

        /*
        // Web Scraping Tools (from @the-new-fuse/web-scraping)
        ...this.webScrapingTools.getTools().map((t: any) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
        */

        // Jules Coding Agent Tools (from @the-new-fuse/jules-skill)
        {
          name: 'jules_create_session',
          description: `Create a new Jules coding session. Jules is Google's autonomous AI coding agent that can work on tasks asynchronously. Use this to delegate complex coding tasks like implementing features, fixing bugs, refactoring code, or writing tests.`,
          inputSchema: {
            type: 'object',
            properties: {
              task: {
                type: 'string',
                description:
                  'The task description/instructions for Jules. Be specific about what you want done.',
              },
              repository: {
                type: 'string',
                description:
                  'Optional: Repository in format "owner/repo". Defaults to current directory.',
              },
              workspace_context: {
                type: 'string',
                description:
                  'Optional: Additional context about the workspace/codebase to help Jules.',
              },
              parallel: {
                type: 'number',
                description:
                  'Optional: Number of parallel sessions to create (1-16). Default is 1.',
              },
            },
            required: ['task'],
          },
        },
        {
          name: 'jules_list_sessions',
          description:
            'List all Jules sessions. Returns information about active and completed coding sessions.',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of sessions to return. Default is 10.',
              },
            },
          },
        },
        {
          name: 'jules_get_session',
          description: 'Get details of a specific Jules session by ID.',
          inputSchema: {
            type: 'object',
            properties: {
              session_id: {
                type: 'string',
                description: 'The session ID to retrieve.',
              },
            },
            required: ['session_id'],
          },
        },
        {
          name: 'jules_pull_session',
          description:
            'Pull the results of a completed Jules session. Optionally apply the patch to the local repository.',
          inputSchema: {
            type: 'object',
            properties: {
              session_id: {
                type: 'string',
                description: 'The session ID to pull results from.',
              },
              apply_patch: {
                type: 'boolean',
                description:
                  'Whether to apply the patch to the local repository. Default is false.',
              },
            },
            required: ['session_id'],
          },
        },
      ] as Tool[],
    }));

    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'tnf://system/status',
          name: 'System Status',
          description: 'TNF platform health and service status',
          mimeType: 'application/json',
        },
        {
          uri: 'tnf://system/config',
          name: 'System Configuration',
          description: 'TNF runtime configuration and environment',
          mimeType: 'application/json',
        },
        {
          uri: 'tnf://agents',
          name: 'Agent Registry',
          description: 'All registered agents and their capabilities',
          mimeType: 'application/json',
        },
        {
          uri: 'tnf://workflows',
          name: 'Workflow Registry',
          description: 'Available workflow definitions',
          mimeType: 'application/json',
        },
        {
          uri: 'tnf://protocols',
          name: 'Protocol Registry',
          description: 'Active TNF protocols and their status',
          mimeType: 'application/json',
        },
        {
          uri: 'tnf://timeline/events',
          name: 'Timeline Events',
          description: 'Recent timeline events across all branches',
          mimeType: 'application/json',
        },
        {
          uri: 'tnf://library/sessions',
          name: 'Library Sessions',
          description: 'Virtual Library story sessions',
          mimeType: 'application/json',
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        const resource = await this.handleReadResource(uri);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(resource, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(ErrorCode.InvalidParams, `Resource not found: ${uri}`);
      }
    });

    // Prompt handlers
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'analyze_agent',
          description: "Analyze an agent's capabilities, status, and recent activity",
          arguments: [{ name: 'agentId', description: 'Agent ID to analyze', required: true }],
        },
        {
          name: 'review_workflow',
          description: 'Review a workflow definition for issues and optimizations',
          arguments: [{ name: 'workflowId', description: 'Workflow ID to review', required: true }],
        },
        {
          name: 'summarize_timeline',
          description: 'Summarize timeline events for a given period or branch',
          arguments: [
            { name: 'branch', description: 'Timeline branch name', required: false },
            { name: 'limit', description: 'Maximum events to include', required: false },
          ],
        },
        {
          name: 'explore_library',
          description: 'Explore Virtual Library sessions and note cards',
          arguments: [
            { name: 'shelfCode', description: 'DDC shelf code to browse', required: false },
            { name: 'sessionId', description: 'Specific session to explore', required: false },
          ],
        },
        {
          name: 'diagnose_system',
          description: 'Run system diagnostics and report health status',
          arguments: [],
        },
        {
          name: 'agent_handoff',
          description: 'Generate a structured handoff summary for agent-to-agent transfer',
          arguments: [
            { name: 'fromAgent', description: 'Source agent ID', required: true },
            { name: 'toAgent', description: 'Target agent ID', required: true },
            { name: 'context', description: 'Handoff context summary', required: true },
          ],
        },
      ],
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.handleGetPrompt(name, args || {});
    });

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

          /*
          // Web Scraping Tools
          case 'scrape_website_crawl4ai':
          case 'scrape_website_simple':
          case 'scrape_website_full':
          case 'scrape_website_auto':
          case 'scrape_via_proxy':
          case 'analyze_website_structure': {
            const tool = this.webScrapingTools.getTools().find((t: any) => t.name === name);
            if (!tool)
              throw new McpError(ErrorCode.MethodNotFound, `Scraping tool not found: ${name}`);
            return await tool.handler.execute(args);
          }
          */

          // Jules Tools
          case 'jules_create_session':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.julesClient.createSession(args), null, 2),
                },
              ],
            };
          case 'jules_list_sessions':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.julesClient.listSessions(args), null, 2),
                },
              ],
            };
          case 'jules_get_session':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.julesClient.getSession(args.session_id), null, 2),
                },
              ],
            };
          case 'jules_pull_session':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.julesClient.pullSession(args), null, 2),
                },
              ],
            };

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
      const { provider, target, grantToken, payload } = args;
      try {
        let result: any;
        if (typeof target === 'string' && target.trim()) {
          result = await this.services.agentGrants.adaptiveProxy(
            target.trim(),
            grantToken,
            payload
          );
        } else if (typeof provider === 'string' && provider.trim()) {
          result = await this.services.agentGrants.proxy(provider.trim(), grantToken, payload);
        } else {
          throw new Error('Either provider or target is required');
        }

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

  // Resource handler implementations
  private async handleReadResource(uri: string): Promise<any> {
    switch (uri) {
      case 'tnf://system/status':
        return this.getSystemStatus();

      case 'tnf://system/config':
        return {
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          platform: process.platform,
          services: {
            api: { port: process.env.API_PORT || 3001 },
            gateway: { port: process.env.GATEWAY_PORT || 3005 },
            database: { type: 'postgresql', host: process.env.DB_HOST || 'localhost' },
            redis: {
              host: process.env.REDIS_HOST || 'localhost',
              port: process.env.REDIS_PORT || 6380,
            },
          },
          workspace: this.getWorkspaceRoot(),
        };

      case 'tnf://agents':
        if (this.services.agent) {
          const agents = await this.services.agent.listAgents({ status: 'all' });
          return agents;
        }
        return {
          agents: [
            { id: 'agent-1', name: 'Director Agent', type: 'director', status: 'active' },
            { id: 'agent-2', name: 'Chat Agent', type: 'chat', status: 'active' },
            { id: 'agent-3', name: 'Workflow Agent', type: 'workflow', status: 'inactive' },
          ],
          total: 3,
        };

      case 'tnf://workflows':
        if (this.services.workflow) {
          return await this.services.workflow.listWorkflows({ status: 'all' });
        }
        return {
          workflows: [],
          total: 0,
        };

      case 'tnf://protocols':
        return {
          protocols: [
            {
              name: 'UTP',
              version: '1.0',
              status: 'active',
              description: 'Universal Timeline Protocol',
            },
            {
              name: 'TWIP',
              version: '0.1',
              status: 'active',
              description: 'Terminal Window Identity Protocol',
            },
            {
              name: 'SGP',
              version: '0.1',
              status: 'draft',
              description: 'Spreadsheet Graph Protocol',
            },
            {
              name: 'MCP',
              version: '2.1',
              status: 'active',
              description: 'Model Context Protocol',
            },
          ],
        };

      case 'tnf://timeline/events':
        return {
          events: [],
          message: 'Timeline events available via timeline API',
        };

      case 'tnf://library/sessions':
        return {
          sessions: [],
          message: 'Library sessions available via virtual-library-blueprints',
        };

      default:
        if (uri.startsWith('tnf://agents/')) {
          const agentId = uri.replace('tnf://agents/', '');
          if (this.services.agent) {
            return await this.services.agent.getAgentStatus(agentId);
          }
          return { id: agentId, status: 'unknown' };
        }

        if (uri.startsWith('tnf://workflows/')) {
          const workflowId = uri.replace('tnf://workflows/', '');
          if (this.services.workflow) {
            return await this.services.workflow.listWorkflows({ status: 'all' });
          }
          return { id: workflowId, status: 'unknown' };
        }

        throw new Error(`Unknown resource URI: ${uri}`);
    }
  }

  private getSystemStatus() {
    return {
      status: this.services.agent ? 'healthy' : 'degraded',
      initialized: true,
      version: '2.1.0',
      uptime: process.uptime(),
      services: {
        agent: !!this.services.agent,
        chat: !!this.services.chat,
        workflow: !!this.services.workflow,
        claudeDev: !!this.services.claudeDev,
        agentGrants: !!this.services.agentGrants,
      },
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  // Prompt handler implementations
  private async handleGetPrompt(name: string, args: Record<string, string>): Promise<any> {
    switch (name) {
      case 'analyze_agent': {
        const agentId = args.agentId || 'unknown';
        let agentStatus: any = { id: agentId, status: 'unknown' };
        if (this.services.agent) {
          try {
            agentStatus = await this.services.agent.getAgentStatus(agentId);
          } catch (_e) {
            agentStatus = { id: agentId, status: 'not-found' };
          }
        }
        return {
          description: `Analysis of agent ${agentId}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please provide a detailed analysis of agent ${agentId} including its capabilities, current status, recent tasks, and any recommendations for optimization.`,
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: [
                  `# Agent Analysis: ${agentId}`,
                  '',
                  '## Current Status',
                  `- Status: ${agentStatus.status || 'unknown'}`,
                  agentStatus.health ? `- Health: ${agentStatus.health}` : null,
                  '',
                  '## Recommendations',
                  '- Review agent task queue for bottlenecks',
                  '- Check resource utilization',
                  '- Verify agent communication channels',
                ]
                  .filter(Boolean)
                  .join('\n'),
              },
            },
          ],
        };
      }

      case 'review_workflow': {
        const workflowId = args.workflowId || 'unknown';
        return {
          description: `Review of workflow ${workflowId}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Review workflow ${workflowId} for potential issues, optimization opportunities, and compliance with TNF guidelines.`,
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: [
                  `# Workflow Review: ${workflowId}`,
                  '',
                  '## Checklist',
                  '- [ ] Error handling defined for all steps',
                  '- [ ] Timeout configurations set',
                  '- [ ] Input validation in place',
                  '- [ ] Output contracts documented',
                  '- [ ] Dependencies explicitly defined',
                  '',
                  '## Optimization Opportunities',
                  '- Consider parallel execution for independent steps',
                  '- Add retry logic for transient failures',
                  '- Implement circuit breaker for external calls',
                ].join('\n'),
              },
            },
          ],
        };
      }

      case 'summarize_timeline': {
        const branch = args.branch || 'main';
        const limit = args.limit || '10';
        return {
          description: `Timeline summary for branch ${branch}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Summarize the most recent ${limit} timeline events on branch "${branch}", highlighting key milestones and patterns.`,
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: [
                  `# Timeline Summary: ${branch}`,
                  '',
                  `Branch: ${branch}`,
                  `Recent Events: ${limit}`,
                  '',
                  '## Key Milestones',
                  '- Last N events analyzed for patterns',
                  '',
                  '## Notes',
                  '- Full timeline available via tnf://timeline/events resource',
                  '- Events can be filtered by branch, date range, and type',
                ].join('\n'),
              },
            },
          ],
        };
      }

      case 'explore_library': {
        const scope = args.shelfCode || args.sessionId || 'all';
        return {
          description: `Library exploration: ${scope}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Explore the Virtual Library with focus on "${scope}". Identify relevant sessions, note cards, and knowledge artifacts.`,
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: [
                  '# Virtual Library Exploration',
                  '',
                  `Scope: ${scope}`,
                  '',
                  '## Available Resources',
                  '- Story sessions with 5-ring question system',
                  '- Note cards with captured discoveries',
                  '- Timeline events linked to sessions',
                  '- Agent access-controlled knowledge',
                  '',
                  'Full library data available via tnf://library/sessions resource',
                ].join('\n'),
              },
            },
          ],
        };
      }

      case 'diagnose_system':
        return {
          description: 'System diagnostics report',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: 'Run comprehensive system diagnostics and report the health of all TNF services.',
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: [
                  '# System Diagnostics',
                  '',
                  '## Service Status',
                  `- Agent Service: ${this.services.agent ? '✅ Connected' : '❌ Disconnected'}`,
                  `- Chat Service: ${this.services.chat ? '✅ Connected' : '❌ Disconnected'}`,
                  `- Workflow Service: ${this.services.workflow ? '✅ Connected' : '❌ Disconnected'}`,
                  `- ClaudeDev Service: ${this.services.claudeDev ? '✅ Connected' : '❌ Disconnected'}`,
                  `- Agent Grants: ${this.services.agentGrants ? '✅ Connected' : '❌ Disconnected'}`,
                  '',
                  '## Resource Check',
                  `- Uptime: ${Math.floor(process.uptime())}s`,
                  `- Memory: ${JSON.stringify(process.memoryUsage())}`,
                  `- Node: ${process.version}`,
                ].join('\n'),
              },
            },
          ],
        };

      case 'agent_handoff':
        return {
          description: 'Agent handoff summary',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Generate a structured handoff from ${args.fromAgent || 'unknown'} to ${args.toAgent || 'unknown'}. Context: ${args.context || 'No context provided'}.`,
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: [
                  '# Agent Handoff Summary',
                  '',
                  `## Transfer: ${args.fromAgent || 'unknown'} → ${args.toAgent || 'unknown'}`,
                  '',
                  '## Context',
                  args.context || 'No context provided',
                  '',
                  '## Verification Checklist',
                  '- [ ] Merkle hash computed for handoff integrity',
                  '- [ ] State snapshot captured pre-transfer',
                  '- [ ] Outstanding tasks transferred',
                  '- [ ] Communication channels handed over',
                  '',
                  '## Instructions for Receiving Agent',
                  '1. Verify handoff Merkle hash before proceeding',
                  '2. Review state snapshot for continuity',
                  '3. Confirm receipt of all queued tasks',
                  '4. Establish communication with active channels',
                ].join('\n'),
              },
            },
          ],
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown prompt: ${name}`);
    }
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
