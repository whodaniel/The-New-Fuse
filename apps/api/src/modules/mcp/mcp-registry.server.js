"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPRegistryServer = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("@the-new-fuse/types");
const mcp_registry_service_1 = require("./mcp-registry.service");
let MCPRegistryServer = MCPRegistryServer_1 = class MCPRegistryServer {
    registryService;
    logger = new common_1.Logger(MCPRegistryServer_1.name);
    constructor(registryService) {
        this.registryService = registryService;
    }
    async handleMessage(message) {
        try {
            const mcpMessage = (0, types_1.parseMCPMessage)(message);
            const response = await this.processMessage(mcpMessage);
            return JSON.stringify(response);
        }
        catch (error) {
            this.logger.error('Error handling MCP message:', error);
            const errorResponse = (0, types_1.createMCPError)('unknown', -1, `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return JSON.stringify(errorResponse);
        }
    }
    async processMessage(message) {
        const { id, method, params } = message;
        try {
            switch (method) {
                case 'agent.register':
                    const agent = await this.registryService.registerAgent(params);
                    return (0, types_1.createMCPResponse)(id, agent);
                case 'agent.get':
                    const retrievedAgent = await this.registryService.getAgentById(params?.id);
                    return (0, types_1.createMCPResponse)(id, retrievedAgent);
                case 'agent.update':
                    const updatedAgent = await this.registryService.updateAgentProfile(params?.id, params?.updates);
                    return (0, types_1.createMCPResponse)(id, updatedAgent);
                case 'agent.delete':
                    const deleteResult = await this.registryService.deleteAgent(params?.id);
                    return (0, types_1.createMCPResponse)(id, { success: deleteResult });
                case 'agent.list':
                    const agents = await this.registryService.listAgents();
                    return (0, types_1.createMCPResponse)(id, agents);
                case 'entity.register':
                    const entity = await this.registryService.registerEntity(params);
                    return (0, types_1.createMCPResponse)(id, entity);
                case 'entity.get':
                    const retrievedEntity = await this.registryService.getEntityById(params?.id);
                    return (0, types_1.createMCPResponse)(id, retrievedEntity);
                case 'entity.update':
                    const updatedEntity = await this.registryService.updateEntity(params?.id, params?.updates);
                    return (0, types_1.createMCPResponse)(id, updatedEntity);
                case 'entity.delete':
                    const entityDeleteResult = await this.registryService.deleteEntity(params?.id);
                    return (0, types_1.createMCPResponse)(id, { success: entityDeleteResult });
                case 'entity.list':
                    const entities = await this.registryService.listEntities();
                    return (0, types_1.createMCPResponse)(id, entities);
                case 'tools.list':
                    const tools = this.getAvailableTools();
                    return (0, types_1.createMCPResponse)(id, tools);
                default:
                    return (0, types_1.createMCPError)(id, -32601, `Method not found: ${method}`);
            }
        }
        catch (error) {
            this.logger.error(`Error processing method ${method}:`, error);
            return (0, types_1.createMCPError)(id, -32603, `Internal error processing ${method}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    getAvailableTools() {
        return [
            {
                name: 'agent.register',
                description: 'Register a new agent in the system',
                inputSchema: {
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
                inputSchema: {
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
                inputSchema: {
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
exports.MCPRegistryServer = MCPRegistryServer;
exports.MCPRegistryServer = MCPRegistryServer = MCPRegistryServer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mcp_registry_service_1.MCPRegistryService])
], MCPRegistryServer);
