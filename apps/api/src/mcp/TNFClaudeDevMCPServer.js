var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TNFClaudeDevMCPServer_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
let TNFClaudeDevMCPServer = TNFClaudeDevMCPServer_1 = class TNFClaudeDevMCPServer {
    claudeDevService;
    logger = new Logger(TNFClaudeDevMCPServer_1.name);
    tools = [];
    constructor(claudeDevService) {
        this.claudeDevService = claudeDevService;
        this.initializeTools();
    }
    initializeTools() {
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
    async handleInitialize() {
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
    async handleListTools() {
        return {
            id: 'tools-list',
            result: {
                tools: this.tools
            }
        };
    }
    // Handle tools/call request
    async handleToolCall(request) {
        const { name, arguments: args } = request.params;
        try {
            let result;
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
        }
        catch (error) {
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
    async handleListTemplates(category) {
        const templates = await this.claudeDevService.listTemplates(category);
        return { templates };
    }
    async handleGetTemplate(templateId) {
        if (!templateId) {
            throw new Error('Template ID is required');
        }
        const template = await this.claudeDevService.getTemplate(templateId);
        return { template };
    }
    async handleExecuteAutomation(args) {
        const { templateId, parameters, priority, context } = args;
        if (!templateId || !parameters) {
            throw new Error('Template ID and parameters are required');
        }
        const automationRequest = {
            templateId,
            parameters,
            userId: 'mcp-user', // In a real implementation, get this from the MCP context
            priority: priority || 'medium',
            context
        };
        const automation = await this.claudeDevService.executeAutomation(automationRequest);
        return { automation };
    }
    async handleGetAutomationResult(automationId) {
        if (!automationId) {
            throw new Error('Automation ID is required');
        }
        const automation = await this.claudeDevService.getAutomationResult(automationId);
        return { automation };
    }
    async handleListAutomations(limit, status) {
        const userId = 'mcp-user'; // In a real implementation, get this from the MCP context
        let automations = await this.claudeDevService.listAutomations(userId, limit || 50);
        if (status) {
            automations = automations.filter(a => a.status === status);
        }
        return { automations };
    }
    async handleCancelAutomation(automationId) {
        if (!automationId) {
            throw new Error('Automation ID is required');
        }
        const userId = 'mcp-user'; // In a real implementation, get this from the MCP context
        const cancelled = await this.claudeDevService.cancelAutomation(automationId, userId);
        return { cancelled };
    }
    async handleCreateCustomTemplate(templateData) {
        const templateId = await this.claudeDevService.createCustomTemplate(templateData);
        return { templateId };
    }
    async handleGetUsageStats() {
        const userId = 'mcp-user'; // In a real implementation, get this from the MCP context
        const stats = await this.claudeDevService.getUsageStats(userId);
        return { stats };
    }
    // Main MCP message handler
    async handleMessage(message) {
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
    getAvailableTools() {
        return [...this.tools];
    }
    // Utility method to validate MCP requests
    validateRequest(request) {
        if (!request.id) {
            throw new Error('Request ID is required');
        }
        if (!request.method) {
            throw new Error('Request method is required');
        }
    }
};
TNFClaudeDevMCPServer = TNFClaudeDevMCPServer_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof ClaudeDevAutomationService !== "undefined" && ClaudeDevAutomationService) === "function" ? _a : Object])
], TNFClaudeDevMCPServer);
export { TNFClaudeDevMCPServer };
//# sourceMappingURL=TNFClaudeDevMCPServer.js.map