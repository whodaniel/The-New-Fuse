import { Injectable, Logger } from '@nestjs/common';
import { ClaudeDevAutomationService, AutomationRequest, AutomationResult, ClaudeDevTemplate } from '../services/ClaudeDevAutomationService';

// MCP (Model Context Protocol) Server for The New Fuse Claude Dev Integration
// This server exposes Claude Dev automation capabilities through a standardized protocol

export interface MCPRequest {
  id: string;
  method: string;
  params?: any;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPNotification {
  method: string;
  params?: any;
}

// MCP Tool definitions for Claude Dev automation
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

@Injectable()
export class TNFClaudeDevMCPServer {
  private readonly logger = new Logger(TNFClaudeDevMCPServer.name);
  private readonly tools: MCPTool[] = [];

  constructor(
    private readonly claudeDevService: ClaudeDevAutomationService,
  ) {
    this.initializeTools();
  }

  private initializeTools(): void {
    // Define MCP tools for Claude Dev automation
    this.tools = [
      {
        name: 'tnf_list_templates',
        description: 'List available automation templates with optional category filtering',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['development', 'analysis', 'automation', 'communication'],
              description: 'Filter templates by category'
            }
          }
        }
      },
      {
        name: 'tnf_get_template',
        description: 'Get detailed information about a specific template',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: {
              type: 'string',
              description: 'ID of the template to retrieve'
            }
          },
          required: ['templateId']
        }
      },
      {
        name: 'tnf_execute_automation',
        description: 'Execute an automation using a specified template with parameters',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: {
              type: 'string',
              description: 'ID of the template to use'
            },
            parameters: {
              type: 'object',
              description: 'Parameters required by the template'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Execution priority'
            },
            context: {
              type: 'object',
              properties: {
                projectId: { type: 'string' },
                workflowId: { type: 'string' },
                parentTaskId: { type: 'string' }
              },
              description: 'Additional context for the automation'
            }
          },
          required: ['templateId', 'parameters']
        }
      },
      {
        name: 'tnf_get_automation_result',
        description: 'Get the result of a specific automation execution',
        inputSchema: {
          type: 'object',
          properties: {
            automationId: {
              type: 'string',
              description: 'ID of the automation to check'
            }
          },
          required: ['automationId']
        }
      },
      {
        name: 'tnf_list_automations',
        description: 'List recent automation executions for the current user',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              description: 'Maximum number of results to return'
            },
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
              description: 'Filter by automation status'
            }
          }
        }
      },
      {
        name: 'tnf_cancel_automation',
        description: 'Cancel a running automation',
        inputSchema: {
          type: 'object',
          properties: {
            automationId: {
              type: 'string',
              description: 'ID of the automation to cancel'
            }
          },
          required: ['automationId']
        }
      },
      {
        name: 'tnf_create_custom_template',
        description: 'Create a new custom automation template',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the template'
            },
            description: {
              type: 'string',
              description: 'Description of what the template does'
            },
            category: {
              type: 'string',
              enum: ['development', 'analysis', 'automation', 'communication'],
              description: 'Template category'
            },
            prompt: {
              type: 'string',
              description: 'The prompt template with parameter placeholders'
            },
            parameters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['string', 'number', 'boolean', 'array', 'object'] },
                  description: { type: 'string' },
                  required: { type: 'boolean' },
                  defaultValue: {},
                  validation: {
                    type: 'object',
                    properties: {
                      min: { type: 'number' },
                      max: { type: 'number' },
                      pattern: { type: 'string' },
                      options: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                required: ['name', 'type', 'description', 'required']
              },
              description: 'Template parameters definition'
            },
            outputFormat: {
              type: 'string',
              enum: ['json', 'markdown', 'code', 'plain'],
              description: 'Expected output format'
            },
            estimatedTokens: {
              type: 'number',
              minimum: 1,
              description: 'Estimated token usage'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for template categorization'
            }
          },
          required: ['name', 'description', 'category', 'prompt', 'parameters', 'estimatedTokens', 'tags']
        }
      },
      {
        name: 'tnf_get_usage_stats',
        description: 'Get automation usage statistics for the current user',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];

    this.logger.log(`Initialized MCP server with ${this.tools.length} tools`);
  }

  // Handle MCP initialize request
  async handleInitialize(): Promise<MCPResponse> {
    return {
      id: 'init',
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {}
        },
        serverInfo: {
          name: 'tnf-claude-dev-server',
          version: '1.0.0',
          description: 'The New Fuse Claude Dev Automation MCP Server'
        }
      }
    };
  }

  // Handle tools/list request
  async handleListTools(): Promise<MCPResponse> {
    return {
      id: 'tools-list',
      result: {
        tools: this.tools
      }
    };
  }

  // Handle tools/call request
  async handleToolCall(request: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = request.params;
    
    try {
      let result: any;

      switch (name) {
        case 'tnf_list_templates':
          result = await this.handleListTemplates(args?.category);
          break;

        case 'tnf_get_template':
          result = await this.handleGetTemplate(args?.templateId);
          break;

        case 'tnf_execute_automation':
          result = await this.handleExecuteAutomation(args);
          break;

        case 'tnf_get_automation_result':
          result = await this.handleGetAutomationResult(args?.automationId);
          break;

        case 'tnf_list_automations':
          result = await this.handleListAutomations(args?.limit, args?.status);
          break;

        case 'tnf_cancel_automation':
          result = await this.handleCancelAutomation(args?.automationId);
          break;

        case 'tnf_create_custom_template':
          result = await this.handleCreateCustomTemplate(args);
          break;

        case 'tnf_get_usage_stats':
          result = await this.handleGetUsageStats();
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };

    } catch (error) {
      this.logger.error(`Tool call failed for ${name}:`, error);
      return {
        id: request.id,
        error: {
          code: -32603,
          message: error.message || 'Internal error',
          data: { tool: name, args }
        }
      };
    }
  }

  // Tool implementation methods
  private async handleListTemplates(category?: string): Promise<{ templates: ClaudeDevTemplate[] }> {
    const templates = await this.claudeDevService.listTemplates(category);
    return { templates };
  }

  private async handleGetTemplate(templateId: string): Promise<{ template: ClaudeDevTemplate | null }> {
    if (!templateId) {
      throw new Error('Template ID is required');
    }
    
    const template = await this.claudeDevService.getTemplate(templateId);
    return { template };
  }

  private async handleExecuteAutomation(args: any): Promise<{ automation: AutomationResult }> {
    const { templateId, parameters, priority, context } = args;
    
    if (!templateId || !parameters) {
      throw new Error('Template ID and parameters are required');
    }

    const automationRequest: AutomationRequest = {
      templateId,
      parameters,
      userId: 'mcp-user', // In a real implementation, get this from the MCP context
      priority: priority || 'medium',
      context
    };

    const automation = await this.claudeDevService.executeAutomation(automationRequest);
    return { automation };
  }

  private async handleGetAutomationResult(automationId: string): Promise<{ automation: AutomationResult | null }> {
    if (!automationId) {
      throw new Error('Automation ID is required');
    }

    const automation = await this.claudeDevService.getAutomationResult(automationId);
    return { automation };
  }

  private async handleListAutomations(limit?: number, status?: string): Promise<{ automations: AutomationResult[] }> {
    const userId = 'mcp-user'; // In a real implementation, get this from the MCP context
    let automations = await this.claudeDevService.listAutomations(userId, limit || 50);

    if (status) {
      automations = automations.filter(a => a.status === status);
    }

    return { automations };
  }

  private async handleCancelAutomation(automationId: string): Promise<{ cancelled: boolean }> {
    if (!automationId) {
      throw new Error('Automation ID is required');
    }

    const userId = 'mcp-user'; // In a real implementation, get this from the MCP context
    const cancelled = await this.claudeDevService.cancelAutomation(automationId, userId);
    return { cancelled };
  }

  private async handleCreateCustomTemplate(templateData: any): Promise<{ templateId: string }> {
    const templateId = await this.claudeDevService.createCustomTemplate(templateData);
    return { templateId };
  }

  private async handleGetUsageStats(): Promise<any> {
    const userId = 'mcp-user'; // In a real implementation, get this from the MCP context
    const stats = await this.claudeDevService.getUsageStats(userId);
    return { stats };
  }

  // Main MCP message handler
  async handleMessage(message: MCPRequest): Promise<MCPResponse> {
    this.logger.debug(`Handling MCP message: ${message.method}`);

    switch (message.method) {
      case 'initialize':
        return this.handleInitialize();

      case 'tools/list':
        return this.handleListTools();

      case 'tools/call':
        return this.handleToolCall(message);

      default:
        return {
          id: message.id,
          error: {
            code: -32601,
            message: `Method not found: ${message.method}`
          }
        };
    }
  }

  // Get available tools for external inspection
  getAvailableTools(): MCPTool[] {
    return [...this.tools];
  }

  // Utility method to validate MCP requests
  private validateRequest(request: MCPRequest): void {
    if (!request.id) {
      throw new Error('Request ID is required');
    }
    if (!request.method) {
      throw new Error('Request method is required');
    }
  }
}
