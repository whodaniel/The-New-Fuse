/**
 * The New Fuse Agent Automation MCP Server
 * 
 * This MCP server provides tools for Roo Code to interact with
 * The New Fuse agent automation system directly.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { RooAgentAutomationService } from '../services/RooAgentAutomationService';
import { MCPService } from '../services/MCPService';

/**
 * TNF Agent Automation MCP Server
 */
class TNFAgentAutomationMCPServer {
  private server: Server;
  private agentService: RooAgentAutomationService;

  constructor() {
    this.server = new Server(
      {
        name: 'tnf-agent-automation',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize the agent service
    const mcpService = new MCPService();
    this.agentService = new RooAgentAutomationService(mcpService);
    
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_agent',
            description: 'Create a new Roo Code agent from a template',
            inputSchema: {
              type: 'object',
              properties: {
                templateKey: {
                  type: 'string',
                  description: 'The template key to use for the agent',
                  enum: [
                    'senior-developer',
                    'qa-engineer',
                    'devops-engineer',
                    'ui-ux-designer',
                    'technical-writer',
                    'security-auditor',
                    'data-scientist',
                    'product-manager',
                    'api-specialist',
                    'database-architect',
                    'workflow-orchestrator',
                    'mcp-integration-specialist',
                    'agent-communication-expert'
                  ]
                },
                customName: {
                  type: 'string',
                  description: 'Optional custom name for the agent'
                },
                isGlobal: {
                  type: 'boolean',
                  description: 'Whether to create as global agent',
                  default: true
                },
                mcpEnabled: {
                  type: 'boolean',
                  description: 'Whether to enable MCP servers',
                  default: true
                },
                autoStart: {
                  type: 'boolean',
                  description: 'Whether to auto-start communication',
                  default: true
                }
              },
              required: ['templateKey']
            }
          },
          {
            name: 'create_team',
            description: 'Create a development team with multiple agents',
            inputSchema: {
              type: 'object',
              properties: {
                teamType: {
                  type: 'string',
                  description: 'The type of team to create',
                  enum: ['fullstack', 'startup', 'tnf-platform']
                }
              },
              required: ['teamType']
            }
          },
          {
            name: 'list_templates',
            description: 'List all available agent templates',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'list_active_agents',
            description: 'List all currently active agents',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_agent',
            description: 'Get details of a specific agent by slug',
            inputSchema: {
              type: 'object',
              properties: {
                slug: {
                  type: 'string',
                  description: 'The slug identifier of the agent'
                }
              },
              required: ['slug']
            }
          },
          {
            name: 'delete_agent',
            description: 'Delete an agent configuration',
            inputSchema: {
              type: 'object',
              properties: {
                slug: {
                  type: 'string',
                  description: 'The slug identifier of the agent to delete'
                },
                isGlobal: {
                  type: 'boolean',
                  description: 'Whether to delete global configuration',
                  default: true
                }
              },
              required: ['slug']
            }
          },
          {
            name: 'get_statistics',
            description: 'Get agent usage statistics',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'batch_create_agents',
            description: 'Create multiple agents in batch',
            inputSchema: {
              type: 'object',
              properties: {
                requests: {
                  type: 'array',
                  description: 'Array of agent creation requests',
                  items: {
                    type: 'object',
                    properties: {
                      templateKey: { type: 'string' },
                      customizations: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          customInstructions: { type: 'string' }
                        }
                      }
                    },
                    required: ['templateKey']
                  }
                }
              },
              required: ['requests']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        await this.ensureInitialized();

        switch (request.params.name) {
          case 'create_agent':
            return await this.handleCreateAgent(request.params.arguments);
          
          case 'create_team':
            return await this.handleCreateTeam(request.params.arguments);
          
          case 'list_templates':
            return await this.handleListTemplates();
          
          case 'list_active_agents':
            return await this.handleListActiveAgents();
          
          case 'get_agent':
            return await this.handleGetAgent(request.params.arguments);
          
          case 'delete_agent':
            return await this.handleDeleteAgent(request.params.arguments);
          
          case 'get_statistics':
            return await this.handleGetStatistics();
          
          case 'batch_create_agents':
            return await this.handleBatchCreateAgents(request.params.arguments);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  private async ensureInitialized() {
    // Initialize the service if not already done
    try {
      await this.agentService.initialize(process.cwd());
    } catch (error) {
      // Service might already be initialized
    }
  }

  private async handleCreateAgent(args: any) {
    const { templateKey, customName, isGlobal = true, mcpEnabled = true, autoStart = true } = args;
    
    const customizations = customName ? { name: customName } : undefined;
    
    const agent = await this.agentService.createAgent({
      templateKey,
      customizations,
      isGlobal,
      mcpEnabled,
      autoStart
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Agent '${agent.name}' created successfully`,
            agent: {
              name: agent.name,
              slug: agent.slug,
              categories: agent.categories,
              tags: agent.tags,
              preferredModel: agent.preferredModel
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleCreateTeam(args: any) {
    const { teamType } = args;
    
    const agents = await this.agentService.createDevelopmentTeam(teamType);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Team '${teamType}' created with ${agents.length} agents`,
            teamType,
            agents: agents.map(agent => ({
              name: agent.name,
              slug: agent.slug,
              categories: agent.categories
            }))
          }, null, 2)
        }
      ]
    };
  }

  private async handleListTemplates() {
    const templates = this.agentService.getAvailableTemplates();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            templates: templates.map(t => ({
              key: t.key,
              name: t.name,
              description: t.description,
              categories: t.categories,
              tags: t.tags
            }))
          }, null, 2)
        }
      ]
    };
  }

  private async handleListActiveAgents() {
    const activeAgents = this.agentService.getActiveAgents();
    const agents = Array.from(activeAgents.values());

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: agents.length,
            agents: agents.map(agent => ({
              name: agent.name,
              slug: agent.slug,
              categories: agent.categories,
              preferredModel: agent.preferredModel
            }))
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetAgent(args: any) {
    const { slug } = args;
    
    const agent = this.agentService.getAgent(slug);
    
    if (!agent) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Agent with slug '${slug}' not found`
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            agent: {
              name: agent.name,
              slug: agent.slug,
              roleDefinition: agent.roleDefinition,
              whenToUse: agent.whenToUse,
              customInstructions: agent.customInstructions,
              categories: agent.categories,
              tags: agent.tags,
              preferredModel: agent.preferredModel,
              temperature: agent.temperature,
              mcpServers: agent.mcpServers
            }
          }, null, 2)
        }
      ]
    };
  }

  private async handleDeleteAgent(args: any) {
    const { slug, isGlobal = true } = args;
    
    if (!this.agentService.hasAgent(slug)) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Agent with slug '${slug}' not found`
      );
    }

    await this.agentService.deleteAgent(slug, { isGlobal });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Agent '${slug}' deleted successfully`
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetStatistics() {
    const stats = await this.agentService.getAgentStatistics();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            statistics: stats
          }, null, 2)
        }
      ]
    };
  }

  private async handleBatchCreateAgents(args: any) {
    const { requests } = args;
    
    const result = await this.agentService.batchCreateAgents(requests);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Batch operation completed: ${result.successful.length} successful, ${result.failed.length} failed`,
            successful: result.successful.map(agent => ({
              name: agent.name,
              slug: agent.slug
            })),
            failed: result.failed
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('TNF Agent Automation MCP Server running on stdio');
  }
}

// Start the server
const server = new TNFAgentAutomationMCPServer();
server.run().catch(console.error);
