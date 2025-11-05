var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MCPRegistryServer_1;
var _a;
import { Injectable, Logger } from '@nestjs/common';
import { parseMCPMessage, createMCPResponse, createMCPError } from '@the-new-fuse/types';
import { MCPRegistryService } from './mcp-registry.service';
let MCPRegistryServer = MCPRegistryServer_1 = class MCPRegistryServer {
    registryService;
    logger = new Logger(MCPRegistryServer_1.name);
    constructor(registryService) {
        this.registryService = registryService;
    }
    async handleMessage(message) {
        try {
            const mcpMessage = parseMCPMessage(message);
            const response = await this.processMessage(mcpMessage);
            return JSON.stringify(response);
        }
        catch (error) {
            this.logger.error('Error handling MCP message:', error);
            const errorResponse = createMCPError('unknown', { code: -1, message: `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}` });
            return JSON.stringify(errorResponse);
        }
    }
    async processMessage(message) {
        const { id, data } = message;
        const { method, params } = data;
        try {
            switch (method) {
                case 'agent.register':
                    const agent = await this.registryService.registerAgent(params);
                    return createMCPResponse(id, agent);
                case 'agent.get':
                    const retrievedAgent = await this.registryService.getAgentById(params?.id);
                    return createMCPResponse(id, retrievedAgent);
                case 'agent.update':
                    const updatedAgent = await this.registryService.updateAgentProfile(params?.id, params?.updates);
                    return createMCPResponse(id, updatedAgent);
                case 'agent.delete':
                    const deleteResult = await this.registryService.deleteAgent(params?.id);
                    return createMCPResponse(id, { success: deleteResult });
                case 'agent.list':
                    const agents = await this.registryService.listAgents();
                    return createMCPResponse(id, agents);
                case 'entity.register':
                    const entity = await this.registryService.registerEntity(params);
                    return createMCPResponse(id, entity);
                case 'entity.get':
                    const retrievedEntity = await this.registryService.getEntityById(params?.id);
                    return createMCPResponse(id, retrievedEntity);
                case 'entity.update':
                    const updatedEntity = await this.registryService.updateEntity(params?.id, params?.updates);
                    return createMCPResponse(id, updatedEntity);
                case 'entity.delete':
                    const entityDeleteResult = await this.registryService.deleteEntity(params?.id);
                    return createMCPResponse(id, { success: entityDeleteResult });
                case 'entity.list':
                    const entities = await this.registryService.listEntities();
                    return createMCPResponse(id, entities);
                case 'tools.list':
                    const tools = this.getAvailableTools();
                    return createMCPResponse(id, tools);
                default:
                    return createMCPError(id, { code: -32601, message: `Method not found: ${method}` });
            }
        }
        catch (error) {
            this.logger.error(`Error processing method ${method}:`, error);
            return createMCPError(id, { code: -32603, message: `Internal error processing ${method}: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
    }
    getAvailableTools() {
        return [
            {
                name: 'agent.register',
                description: 'Register a new agent in the system',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { type: 'string' },
                        capabilities: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['name', 'type']
                }
            },
            {
                name: 'agent.get',
                description: 'Get agent by ID',
                parameters: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'entity.register',
                description: 'Register a new entity in the system',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { type: 'string' },
                        description: { type: 'string' }
                    },
                    required: ['name', 'type']
                }
            }
        ];
    }
};
MCPRegistryServer = MCPRegistryServer_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof MCPRegistryService !== "undefined" && MCPRegistryService) === "function" ? _a : Object])
], MCPRegistryServer);
export { MCPRegistryServer };
//# sourceMappingURL=mcp-registry.server.js.map