var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Injectable, Logger } from '@nestjs/common';
let TNFClaudeDevMCPServer = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TNFClaudeDevMCPServer = _classThis = class {
        constructor(claudeDevService) {
            this.claudeDevService = claudeDevService;
            this.logger = new Logger(TNFClaudeDevMCPServer.name);
            this.tools = [];
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
    __setFunctionName(_classThis, "TNFClaudeDevMCPServer");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TNFClaudeDevMCPServer = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TNFClaudeDevMCPServer = _classThis;
})();
export { TNFClaudeDevMCPServer };
