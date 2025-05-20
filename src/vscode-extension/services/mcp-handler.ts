import { EventEmitter } from 'events';
import { getLogger,  Logger  } from '../core/logging.js';
import { ConfigurationService } from './configuration.js';
import { MCPRequest, MCPResponse, AIAgent, AgentCapability } from '../types/shared.js';

export class MCPHandler extends EventEmitter {
    private static instance: MCPHandler;
    private logger: Logger;
    private config: ConfigurationService;
    private capabilities: Map<string, AgentCapability[]>;
    private contextMap: Map<string, Record<string, any>>;

    private constructor() {
        super();
        this.logger = Logger.getInstance();
        this.config = ConfigurationService.getInstance();
        this.capabilities = new Map();
        this.contextMap = new Map();
    }

    public static getInstance(): MCPHandler {
        if (!MCPHandler.instance) {
            MCPHandler.instance = new MCPHandler();
        }
        return MCPHandler.instance;
    }

    public async initialize(): Promise<void> {
        if (!this.config.getFeatureFlag('mcp')) {
            this.logger.warn('MCP is disabled in configuration');
            return;
        }

        try {
            // Register core MCP capabilities
            await this.registerCoreCapabilities();
            this.logger.info('MCP handler initialized');
        } catch (error) {
            this.logger.error('Failed to initialize MCP handler:', error);
            throw error;
        }
    }

    private async registerCoreCapabilities(): Promise<void> {
        const coreCapabilities: AgentCapability[] = [
            {
                id: 'context-sharing',
                name: 'Context Sharing',
                description: 'Enables sharing and synchronization of context between agents',
                parameters: {
                    contextTypes: ['workspace', 'conversation', 'agent', 'custom']
                }
            },
            {
                id: 'capability-discovery',
                name: 'Capability Discovery',
                description: 'Allows agents to discover and query capabilities of other agents',
                parameters: {
                    queryTypes: ['all', 'byId', 'byType']
                }
            },
            {
                id: 'code-execution',
                name: 'Code Execution',
                description: 'Provides secure code execution capabilities',
                parameters: {
                    languages: ['javascript', 'typescript', 'python'],
                    modes: ['sandbox', 'workspace']
                }
            }
        ];

        this.capabilities.set('vscode.core', coreCapabilities);
    }

    public async handleRequest(request: MCPRequest, sourceAgent: string): Promise<MCPResponse> {
        try {
            this.logger.debug(`Processing MCP request from ${sourceAgent}:`, request);

            // Validate request
            this.validateRequest(request);

            // Process request based on type
            let result: any;
            switch (request.type) {
                case 'context-sharing':
                    result = await this.handleContextRequest(request, sourceAgent);
                    break;

                case 'capability-discovery':
                    result = await this.handleCapabilityRequest(request, sourceAgent);
                    break;

                case 'code-execution':
                    result = await this.handleCodeExecutionRequest(request, sourceAgent);
                    break;

                default:
                    throw new Error(`Unsupported MCP request type: ${request.type}`);
            }

            const response: MCPResponse = {
                type: request.type,
                status: 'success',
                result,
                metadata: {
                    requestId: request.metadata?.requestId,
                    timestamp: Date.now()
                }
            };

            this.logger.debug('MCP response:', response);
            return response;

        } catch (error) {
            const errorResponse: MCPResponse = {
                type: request.type,
                status: 'error',
                result: null,
                error: {
                    code: 'MCP_ERROR',
                    message: (error as Error).message,
                    details: error
                },
                metadata: {
                    requestId: request.metadata?.requestId,
                    timestamp: Date.now()
                }
            };

            this.logger.error('MCP request failed:', errorResponse);
            return errorResponse;
        }
    }

    private validateRequest(request: MCPRequest): void {
        if (!request.type) {
            throw new Error('MCP request must specify a type');
        }

        if (!request.action) {
            throw new Error('MCP request must specify an action');
        }

        // Validate request parameters based on type
        switch (request.type) {
            case 'context-sharing':
                if (!request.parameters.contextType) {
                    throw new Error('Context sharing requests must specify a contextType');
                }
                break;

            case 'capability-discovery':
                if (!request.parameters.queryType) {
                    throw new Error('Capability discovery requests must specify a queryType');
                }
                break;

            case 'code-execution':
                if (!request.parameters.language || !request.parameters.code) {
                    throw new Error('Code execution requests must specify language and code');
                }
                break;
        }
    }

    private async handleContextRequest(
        request: MCPRequest,
        sourceAgent: string
    ): Promise<any> {
        const { action, parameters } = request;
        const contextKey = `${sourceAgent}:${parameters.contextType}`;

        switch (action) {
            case 'get':
                return this.contextMap.get(contextKey) || {};

            case 'set':
                this.contextMap.set(contextKey, parameters.context);
                return { success: true };

            case 'update':
                const existingContext = this.contextMap.get(contextKey) || {};
                this.contextMap.set(contextKey, {
                    ...existingContext,
                    ...parameters.context
                });
                return { success: true };

            case 'delete':
                this.contextMap.delete(contextKey);
                return { success: true };

            default:
                throw new Error(`Unsupported context action: ${action}`);
        }
    }

    private async handleCapabilityRequest(
        request: MCPRequest,
        sourceAgent: string
    ): Promise<any> {
        const { action, parameters } = request;

        switch (action) {
            case 'query':
                if (parameters.agentId) {
                    return this.capabilities.get(parameters.agentId) || [];
                }
                return Array.from(this.capabilities.values()).flat();

            case 'register':
                if (!parameters.capabilities || !Array.isArray(parameters.capabilities)) {
                    throw new Error('Invalid capabilities registration request');
                }
                this.capabilities.set(sourceAgent, parameters.capabilities);
                return { success: true };

            default:
                throw new Error(`Unsupported capability action: ${action}`);
        }
    }

    private async handleCodeExecutionRequest(
        request: MCPRequest,
        sourceAgent: string
    ): Promise<any> {
        const { parameters } = request;

        // Validate execution permissions
        if (!this.hasExecutionPermission(sourceAgent, parameters.mode)) {
            throw new Error('Code execution permission denied');
        }

        try {
            // Execute code in appropriate context
            const result = await this.executeCode(
                parameters.code,
                parameters.language,
                parameters.mode
            );

            return {
                success: true,
                result
            };

        } catch (error) {
            throw new Error(`Code execution failed: ${(error as Error).message}`);
        }
    }

    private hasExecutionPermission(agent: string, mode: string): boolean {
        // Implement permission checking logic
        // For now, only allow sandbox mode for non-core agents
        if (agent === 'vscode.core') {
            return true;
        }
        return mode === 'sandbox';
    }

    private async executeCode(
        code: string,
        language: string,
        mode: string
    ): Promise<any> {
        // Implement secure code execution
        // This is a placeholder - actual implementation would depend on requirements
        this.logger.info(`Executing ${language} code in ${mode} mode`);
        return {
            output: 'Code execution not implemented',
            mode,
            language
        };
    }

    public getCapabilities(agentId: string): AgentCapability[] {
        return this.capabilities.get(agentId) || [];
    }

    public getContext(agentId: string, contextType: string): Record<string, any> {
        return this.contextMap.get(`${agentId}:${contextType}`) || {};
    }
}