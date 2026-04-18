import { Injectable, Logger } from '@nestjs/common';
import { MCPTool } from '@the-new-fuse/mcp-core';
import { WorkflowTemplatesService } from '../workflow-templates/workflow-templates.service.js';

/**
 * MCP Tool Registry Service
 *
 * Manages and provides all MCP tools for The New Fuse platform.
 * Tools are organized into functional groups:
 * - Workflow management
 * - Task execution
 * - Agent communication
 * - Resource access
 * - System operations
 */
@Injectable()
export class MCPToolRegistry {
  private readonly logger = new Logger(MCPToolRegistry.name);
  private tools = new Map<string, MCPTool>();
  private readonly twipCapabilityCard = {
    name: 'twip-identity',
    version: '0.1',
    status: 'draft',
    schemas: {
      envelope: 'docs/protocols/schemas/twip-envelope.schema.json',
      identity: 'docs/protocols/schemas/twip-identity.schema.json',
    },
    safetyFlags: ['tenant_scoped', 'ttl_enforced', 'provenance_required'],
  };

  constructor(private readonly workflowService: WorkflowTemplatesService) {
    this.registerAllTools();
  }

  /**
   * Register all available tools
   */
  private registerAllTools(): void {
    // Workflow tools
    this.registerWorkflowTools();

    // Task tools
    this.registerTaskTools();

    // Agent tools
    this.registerAgentTools();

    // Resource tools
    this.registerResourceTools();

    // Communication tools
    this.registerCommunicationTools();

    // Protocol tools
    this.registerProtocolTools();

    // System tools
    this.registerSystemTools();

    this.logger.log(`Registered ${this.tools.size} MCP tools`);
  }

  /**
   * Register protocol interoperability tools
   */
  private registerProtocolTools(): void {
    this.registerTool({
      name: 'protocol.twip.register_capability',
      description: 'Register TWIP capability metadata for registry and interoperability flows',
      inputSchema: {
        type: 'object',
        properties: {
          tenantId: {
            type: 'string',
            description: 'Tenant identifier for scoped capability registration',
          },
          source: {
            type: 'string',
            description: 'Registration source (relay, orchestrator, manual)',
          },
        },
      },
      handler: {
        execute: async (params: any) => {
          return {
            success: true,
            result: {
              capability: this.twipCapabilityCard,
              registration: {
                tenantId: params.tenantId || null,
                source: params.source || 'unknown',
                registeredAt: new Date().toISOString(),
              },
            },
          };
        },
      },
    });

    this.registerTool({
      name: 'protocol.twip.policy_evaluate',
      description: 'Evaluate TWIP safety policy for envelope-level compliance checks',
      inputSchema: {
        type: 'object',
        properties: {
          tenantId: {
            type: 'string',
            description: 'Tenant identifier',
          },
          ttlSeconds: {
            type: 'number',
            description: 'Requested TTL in seconds',
          },
          allowRemotePropagation: {
            type: 'boolean',
            description: 'Whether remote propagation is requested',
          },
        },
        required: ['tenantId'],
      },
      handler: {
        execute: async (params: any) => {
          const ttl = Number(params.ttlSeconds || 300);
          const decision = {
            allow: Boolean(params.tenantId) && Number.isFinite(ttl) && ttl > 0 && ttl <= 3600,
            reason: 'allow',
            checks: {
              tenantScoped: Boolean(params.tenantId),
              ttlBounded: Number.isFinite(ttl) && ttl > 0 && ttl <= 3600,
              remotePropagationDisabled: params.allowRemotePropagation !== true,
            },
            evaluatedAt: new Date().toISOString(),
          };
          if (!decision.checks.tenantScoped) {
            decision.allow = false;
            decision.reason = 'missing_tenant';
          } else if (!decision.checks.ttlBounded) {
            decision.allow = false;
            decision.reason = 'ttl_out_of_bounds';
          } else if (!decision.checks.remotePropagationDisabled) {
            decision.allow = false;
            decision.reason = 'remote_propagation_not_allowed';
          }

          return {
            success: decision.allow,
            result: {
              policy: {
                tenantId: params.tenantId,
                ttlSeconds: Number.isFinite(ttl) ? ttl : 300,
                allowRemotePropagation: params.allowRemotePropagation === true,
              },
              decision,
            },
          };
        },
      },
    });
  }

  /**
   * Register workflow management tools
   */
  private registerWorkflowTools(): void {
    // Create workflow
    this.registerTool({
      name: 'workflow.create',
      description: 'Create a new workflow from a template or custom definition',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the workflow',
          },
          description: {
            type: 'string',
            description: 'Description of the workflow',
          },
          templateId: {
            type: 'string',
            description: 'Optional template ID to create from',
          },
          definition: {
            type: 'object',
            description: 'Workflow definition (nodes, edges, config)',
          },
        },
        required: ['name'],
      },
      handler: {
        execute: async (params: any) => {
          this.logger.debug(`Creating workflow: ${params.name}`);
          // Implementation would integrate with workflow service
          return {
            success: true,
            result: {
              workflowId: `wf_${Date.now()}`,
              message: `Workflow "${params.name}" created successfully`,
            },
          };
        },
      },
    });

    // Execute workflow
    this.registerTool({
      name: 'workflow.execute',
      description: 'Execute a workflow with provided inputs',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'ID of the workflow to execute',
          },
          inputs: {
            type: 'object',
            description: 'Input parameters for the workflow',
          },
          async: {
            type: 'boolean',
            description: 'Execute asynchronously (default: false)',
          },
        },
        required: ['workflowId'],
      },
      handler: {
        execute: async (params: any) => {
          this.logger.debug(`Executing workflow: ${params.workflowId}`);
          return {
            success: true,
            result: {
              executionId: `exec_${Date.now()}`,
              status: params.async ? 'running' : 'completed',
              result: params.async ? null : { output: 'Workflow execution result' },
            },
          };
        },
      },
    });

    // List workflows
    this.registerTool({
      name: 'workflow.list',
      description: 'List all available workflows and templates',
      inputSchema: {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'Filter by name or description',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results',
          },
        },
      },
      handler: {
        execute: async (params: any) => {
          const templates = await this.getWorkflowTemplates();
          let filtered = templates;

          if (params.filter) {
            const filter = params.filter.toLowerCase();
            filtered = templates.filter(
              (t: any) =>
                t.name.toLowerCase().includes(filter) ||
                t.description.toLowerCase().includes(filter)
            );
          }

          if (params.limit) {
            filtered = filtered.slice(0, params.limit);
          }

          return {
            success: true,
            result: {
              workflows: filtered,
              total: filtered.length,
            },
          };
        },
      },
    });

    // Get workflow status
    this.registerTool({
      name: 'workflow.status',
      description: 'Get the status of a workflow execution',
      inputSchema: {
        type: 'object',
        properties: {
          executionId: {
            type: 'string',
            description: 'Execution ID to check',
          },
        },
        required: ['executionId'],
      },
      handler: {
        execute: async (params: any) => {
          return {
            success: true,
            result: {
              executionId: params.executionId,
              status: 'completed',
              progress: 100,
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
            },
          };
        },
      },
    });
  }

  /**
   * Register task execution tools
   */
  private registerTaskTools(): void {
    // Create task
    this.registerTool({
      name: 'task.create',
      description: 'Create and assign a task to an agent',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Task title',
          },
          description: {
            type: 'string',
            description: 'Task description',
          },
          assignedTo: {
            type: 'string',
            description: 'Agent ID to assign the task to',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Task priority',
          },
          metadata: {
            type: 'object',
            description: 'Additional task metadata',
          },
        },
        required: ['title', 'assignedTo'],
      },
      handler: {
        execute: async (params: any) => {
          this.logger.debug(`Creating task: ${params.title}`);
          return {
            success: true,
            result: {
              taskId: `task_${Date.now()}`,
              status: 'pending',
              assignedTo: params.assignedTo,
            },
          };
        },
      },
    });

    // Get task status
    this.registerTool({
      name: 'task.status',
      description: 'Get the status of a task',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task ID',
          },
        },
        required: ['taskId'],
      },
      handler: {
        execute: async (params: any) => {
          return {
            success: true,
            result: {
              taskId: params.taskId,
              status: 'in_progress',
              progress: 50,
              assignedTo: 'agent_123',
              createdAt: new Date().toISOString(),
            },
          };
        },
      },
    });

    // Update task
    this.registerTool({
      name: 'task.update',
      description: 'Update task status or details',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task ID',
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
          },
          progress: {
            type: 'number',
            description: 'Progress percentage (0-100)',
          },
          result: {
            type: 'object',
            description: 'Task result data',
          },
        },
        required: ['taskId'],
      },
      handler: {
        execute: async (params: any) => {
          return {
            success: true,
            result: {
              taskId: params.taskId,
              updated: true,
            },
          };
        },
      },
    });
  }

  /**
   * Register agent communication tools
   */
  private registerAgentTools(): void {
    // Send message to agent
    this.registerTool({
      name: 'agent.message',
      description: 'Send a message to another agent',
      inputSchema: {
        type: 'object',
        properties: {
          targetAgent: {
            type: 'string',
            description: 'Target agent ID',
          },
          message: {
            type: 'string',
            description: 'Message content',
          },
          messageType: {
            type: 'string',
            enum: ['request', 'response', 'notification', 'query'],
            description: 'Type of message',
          },
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high', 'urgent'],
            description: 'Message priority',
          },
          requiresResponse: {
            type: 'boolean',
            description: 'Whether a response is required',
          },
        },
        required: ['targetAgent', 'message'],
      },
      handler: {
        execute: async (params: any) => {
          return {
            success: true,
            result: {
              messageId: `msg_${Date.now()}`,
              deliveredAt: new Date().toISOString(),
              requiresResponse: params.requiresResponse || false,
            },
          };
        },
      },
    });

    // Discover agents
    this.registerTool({
      name: 'agent.discover',
      description: 'Discover available agents and their capabilities',
      inputSchema: {
        type: 'object',
        properties: {
          capability: {
            type: 'string',
            description: 'Filter by capability',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'busy', 'all'],
            description: 'Filter by agent status',
          },
        },
      },
      handler: {
        execute: async (params: any) => {
          const agents = await this.getAgents();
          const filteredAgents = agents.filter((a: any) => {
            if (params.status && params.status !== 'all' && a.status !== params.status) {
              return false;
            }
            if (params.capability && !a.capabilities.includes(params.capability)) {
              return false;
            }
            return true;
          });
          return {
            success: true,
            result: {
              agents: filteredAgents,
              total: filteredAgents.length,
            },
          };
        },
      },
    });

    // Register agent capability
    this.registerTool({
      name: 'agent.register_capability',
      description: 'Register a new capability for an agent',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'Agent ID',
          },
          capability: {
            type: 'string',
            description: 'Capability name',
          },
          description: {
            type: 'string',
            description: 'Capability description',
          },
          metadata: {
            type: 'object',
            description: 'Additional capability metadata',
          },
        },
        required: ['agentId', 'capability'],
      },
      handler: {
        execute: async (params: any) => {
          return {
            success: true,
            result: {
              agentId: params.agentId,
              capability: params.capability,
              registered: true,
            },
          };
        },
      },
    });
  }

  /**
   * Register resource access tools
   */
  private registerResourceTools(): void {
    // Read resource
    this.registerTool({
      name: 'resource.read',
      description: 'Read a resource by URI',
      inputSchema: {
        type: 'object',
        properties: {
          uri: {
            type: 'string',
            description: 'Resource URI (e.g., fuse://workflows/123)',
          },
        },
        required: ['uri'],
      },
      handler: {
        execute: async (params: any) => {
          return {
            success: true,
            result: {
              uri: params.uri,
              content: 'Resource content would be here',
              mimeType: 'application/json',
            },
          };
        },
      },
    });

    // List resources
    this.registerTool({
      name: 'resource.list',
      description: 'List available resources',
      inputSchema: {
        type: 'object',
        properties: {
          prefix: {
            type: 'string',
            description: 'URI prefix to filter resources',
          },
        },
      },
      handler: {
        execute: async (_params: any) => {
          return {
            success: true,
            result: {
              resources: [
                { uri: 'fuse://workflows', description: 'Workflow templates' },
                { uri: 'fuse://agents', description: 'Available agents' },
                { uri: 'fuse://status', description: 'System status' },
              ],
            },
          };
        },
      },
    });
  }

  /**
   * Register communication tools
   */
  private registerCommunicationTools(): void {
    // Broadcast message
    this.registerTool({
      name: 'communication.broadcast',
      description: 'Broadcast a message to multiple agents',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Message to broadcast',
          },
          targets: {
            type: 'array',
            items: { type: 'string' },
            description: 'Target agent IDs (empty for all)',
          },
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high'],
          },
        },
        required: ['message'],
      },
      handler: {
        execute: async (params: any) => {
          return {
            success: true,
            result: {
              broadcastId: `broadcast_${Date.now()}`,
              targetCount: params.targets?.length || 'all',
              sentAt: new Date().toISOString(),
            },
          };
        },
      },
    });

    // Subscribe to events
    this.registerTool({
      name: 'communication.subscribe',
      description: 'Subscribe to event streams',
      inputSchema: {
        type: 'object',
        properties: {
          eventType: {
            type: 'string',
            description: 'Event type to subscribe to',
          },
          filter: {
            type: 'object',
            description: 'Event filter criteria',
          },
        },
        required: ['eventType'],
      },
      handler: {
        execute: async (params: any) => {
          return {
            success: true,
            result: {
              subscriptionId: `sub_${Date.now()}`,
              eventType: params.eventType,
            },
          };
        },
      },
    });
  }

  /**
   * Register system operation tools
   */
  private registerSystemTools(): void {
    // Health check
    this.registerTool({
      name: 'system.health',
      description: 'Get system health status',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: {
        execute: async () => {
          return {
            success: true,
            result: {
              status: 'healthy',
              uptime: process.uptime(),
              timestamp: new Date().toISOString(),
              services: {
                mcp: 'online',
                database: 'online',
                redis: 'online',
              },
            },
          };
        },
      },
    });

    // Get metrics
    this.registerTool({
      name: 'system.metrics',
      description: 'Get system metrics and statistics',
      inputSchema: {
        type: 'object',
        properties: {
          metric: {
            type: 'string',
            description: 'Specific metric to retrieve',
          },
        },
      },
      handler: {
        execute: async (_params: any) => {
          return {
            success: true,
            result: {
              timestamp: new Date().toISOString(),
              metrics: {
                activeAgents: 5,
                runningWorkflows: 3,
                queuedTasks: 12,
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
              },
            },
          };
        },
      },
    });
  }

  /**
   * Register a tool
   */
  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    this.logger.debug(`Registered tool: ${tool.name}`);
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool groups
   */
  getToolGroups(): string[] {
    const groups = new Set<string>();
    for (const tool of this.tools.values()) {
      const [group] = tool.name.split('.');
      groups.add(group);
    }
    return Array.from(groups);
  }

  /**
   * Get tools by group
   */
  getToolsByGroup(group: string): MCPTool[] {
    return Array.from(this.tools.values()).filter((tool) => tool.name.startsWith(`${group}.`));
  }

  /**
   * Get workflow templates (mock implementation)
   */
  async getWorkflowTemplates(): Promise<any[]> {
    // This would integrate with the actual workflow service
    return [
      {
        id: 'wf_template_1',
        name: 'Data Processing Pipeline',
        description: 'Process and transform data through multiple stages',
        category: 'data',
      },
      {
        id: 'wf_template_2',
        name: 'Agent Coordination Workflow',
        description: 'Coordinate multiple agents to complete complex tasks',
        category: 'agent',
      },
      {
        id: 'wf_template_3',
        name: 'API Integration Flow',
        description: 'Integrate with external APIs and process responses',
        category: 'integration',
      },
    ];
  }

  /**
   * Get agents (mock implementation)
   */
  async getAgents(): Promise<any[]> {
    return [
      {
        id: 'agent_coordinator',
        name: 'Coordinator Agent',
        status: 'active',
        capabilities: ['task_management', 'agent_coordination', 'workflow_execution'],
      },
      {
        id: 'agent_data',
        name: 'Data Processing Agent',
        status: 'active',
        capabilities: ['data_processing', 'transformation', 'validation'],
      },
      {
        id: 'agent_api',
        name: 'API Integration Agent',
        status: 'active',
        capabilities: ['api_calls', 'http_requests', 'data_fetching'],
      },
    ];
  }

  /**
   * TWIP capability metadata
   */
  getTwipCapabilityCard(): Record<string, unknown> {
    return this.twipCapabilityCard;
  }
}
