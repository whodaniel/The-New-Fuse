import { MCPRegistry } from './MCPRegistry.js';
import { MCPTool } from './types.js';
import { APIAuthManager } from './APIAuthManager.js';
import { APIMetricsCollector } from './APIMetricsCollector.js';
import { APISpec, APIEndpoint } from '../agents/types/workflow.types.js';
import { Logger } from '../utils/logger.js';

export class APIToolRegistrar {
    private registry: MCPRegistry;
    private authManager: APIAuthManager;
    private metricsCollector: APIMetricsCollector;
    private logger: Logger;

    constructor() {
        this.registry = MCPRegistry.getInstance();
        this.authManager = APIAuthManager.getInstance();
        this.metricsCollector = new APIMetricsCollector();
        this.logger = new Logger('APIToolRegistrar');
    }

    /**
     * Register an API endpoint as an MCP tool
     */
    registerAPIAsTool(
        endpoint: APIEndpoint,
        agentId: string,
        apiSpec: APISpec
    ): MCPTool {
        const toolName = `api_${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        const tool: MCPTool = {
            name: toolName,
            description: endpoint.description || `${endpoint.method} ${endpoint.path}`,
            parameters: endpoint.parameters || {
                type: 'object',
                properties: {}
            },
            execute: async (params: any) => {
                try {
                    // Get authentication headers
                    const authHeaders = await this.authManager.getAuthHeaders(agentId, apiSpec.auth);

                    // Execute the API call with authentication
                    const response = await this.executeAPICall(endpoint, params, authHeaders);

                    // Validate response against schema if provided
                    if (endpoint.responses) {
                        await this.validateResponse(response, endpoint.responses);
                    }

                    return response;
                } catch (error) {
                    this.logger.error(`Error executing API tool ${toolName}: ${error.message}`);
                    throw error;
                }
            }
        };

        // Wrap the tool with metrics collection
        const monitoredTool = this.metricsCollector.wrapToolWithMetrics(
            tool,
            agentId,
            endpoint.path,
            endpoint.method
        );

        // Register the tool with MCP registry
        this.registry.registerCapabilityProvider(agentId, toolName);
        
        return monitoredTool;
    }

    /**
     * Register multiple API endpoints from an OpenAPI/Swagger spec
     */
    async registerFromOpenAPI(specUrl: string, agentId: string, apiSpec: APISpec): Promise<MCPTool[]> {
        const tools: MCPTool[] = [];
        try {
            // Fetch and parse OpenAPI spec
            const spec = await this.fetchOpenAPISpec(specUrl);
            
            // Convert each endpoint to a tool
            for (const [path, methods] of Object.entries(spec.paths)) {
                for (const [method, details] of Object.entries(methods)) {
                    const endpoint: APIEndpoint = {
                        path,
                        method: method.toUpperCase() as any,
                        description: details.description,
                        parameters: this.convertOpenAPIParams(details.parameters),
                        responses: details.responses
                    };

                    const tool = this.registerAPIAsTool(endpoint, agentId, apiSpec);
                    tools.push(tool);
                }
            }
            
            return tools;
        } catch (error) {
            this.logger.error(`Error registering OpenAPI spec: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get performance metrics for API tools
     */
    getAPIMetrics(agentId?: string): {
        byTool: Record<string, any>;
        byAgent?: Record<string, any>;
    } {
        const metrics: any = {
            byTool: {}
        };

        // Get all registered API tools
        const apiTools = Array.from(this.registry.getTools().entries())
            .filter(([name]) => name.startsWith('api_'));

        // Collect metrics for each tool
        for (const [toolName] of apiTools) {
            metrics.byTool[toolName] = this.metricsCollector.getToolMetrics(toolName);
        }

        // If agentId provided, get agent-specific metrics
        if (agentId) {
            metrics.byAgent = {
                [agentId]: this.metricsCollector.getAgentMetrics(agentId)
            };
        }

        return metrics;
    }

    private async executeAPICall(
        endpoint: APIEndpoint,
        params: any,
        authHeaders: Record<string, string>
    ): Promise<any> {
        const url = this.buildUrl(endpoint.path, params);
        
        const response = await fetch(url, {
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders
            },
            body: ['GET', 'HEAD'].includes(endpoint.method) ? undefined : JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }

        return response.json();
    }

    private async validateResponse(response: any, responseSchema: any): Promise<void> {
        // Implement response validation against schema
        // This would typically use a schema validation library like Ajv
    }

    private buildUrl(path: string, params: any): string {
        // Replace path parameters and add query parameters
        let url = path;
        const queryParams = new URLSearchParams();

        for (const [key, value] of Object.entries(params)) {
            if (url.includes(`{${key}}`)) {
                url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
            } else {
                queryParams.append(key, String(value));
            }
        }

        const queryString = queryParams.toString();
        return queryString ? `${url}?${queryString}` : url;
    }

    private convertOpenAPIParams(params: any[]): APIEndpoint['parameters'] {
        if (!params) return undefined;

        const properties: Record<string, any> = {};
        const required: string[] = [];

        params.forEach(param => {
            properties[param.name] = {
                type: param.type,
                description: param.description
            };
            if (param.required) {
                required.push(param.name);
            }
        });

        return {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined
        };
    }

    private async fetchOpenAPISpec(specUrl: string): Promise<any> {
        const response = await fetch(specUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
        }
        return response.json();
    }
}