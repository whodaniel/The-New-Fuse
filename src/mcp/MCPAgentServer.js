var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MCPServer } from './MCPServer.js';
const agentCapabilitySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    version: z.string(),
    parameters: z.record(z.string(), z.unknown()).optional(),
    returns: z.record(z.string(), z.unknown()).optional(),
});
const messageSchema = z.object({
    sender: z.string(),
    recipient: z.string().optional(),
    type: z.enum(['broadcast', 'direct']),
    content: z.any(),
    metadata: z.record(z.string(), z.any()).optional(),
});
/**
 * Simple API Tool Registrar - placeholder implementation
 */
class APIToolRegistrar {
    async register(_agentId, _apiSpec) {
        // Placeholder implementation
    }
}
/**
 * Simple API Validator - placeholder implementation
 */
class AgentAPIValidator {
    validate(_apiSpec) {
        return true;
    }
}
let MCPAgentServer = class MCPAgentServer extends MCPServer {
    agentService;
    apiToolRegistrar;
    apiValidator;
    constructor(options = {}, agentService) {
        super({
            ...options,
            capabilities: {
                ...options.capabilities,
                registerCapability: {
                    description: 'Register new agent capability',
                    parameters: agentCapabilitySchema,
                    execute: async (capability) => this.registerNewCapability(capability),
                },
                sendMessage: {
                    description: 'Send message between agents',
                    parameters: messageSchema,
                    execute: async (message) => this.routeAgentMessage(message),
                },
                discoverAgents: {
                    description: 'Discover available agents',
                    parameters: z.object({
                        filter: z.record(z.string(), z.unknown()).optional(),
                    }),
                    execute: async (params) => this.discoverAgents(params),
                },
            },
        });
        this.agentService = agentService;
        this.apiToolRegistrar = new APIToolRegistrar();
        this.apiValidator = new AgentAPIValidator();
    }
    async registerNewCapability(capability) {
        try {
            await this.validateCapability(capability);
            const registeredCap = this.agentService
                ? await this.agentService.registerCapability(capability)
                : { id: capability.id };
            await this.notifyCapabilityUpdate(registeredCap);
            return { success: true, capabilityId: registeredCap.id };
        }
        catch (error) {
            this.logger.error(`Error registering capability: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    async registerAgentAPI(agentId, apiSpec) {
        this.logger.log(`Registering API for agent ${agentId}`);
        await this.apiToolRegistrar.register(agentId, apiSpec);
    }
    // Placeholder methods for missing implementations
    async routeAgentMessage(_message) {
        return { status: 'sent', messageId: 'mock-msg-id' };
    }
    async discoverAgents(_params) {
        return [];
    }
    async broadcastMessage(_msg) {
        // mock broadcast
    }
    async validateCapability(capability) {
        const result = agentCapabilitySchema.safeParse(capability);
        if (!result.success) {
            throw new Error(`Invalid capability schema: ${result.error}`);
        }
    }
    async notifyCapabilityUpdate(capability) {
        await this.broadcastMessage({
            type: 'capability_update',
            content: capability,
            timestamp: Date.now(),
        });
    }
};
MCPAgentServer = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object, Object])
], MCPAgentServer);
export { MCPAgentServer };
//# sourceMappingURL=MCPAgentServer.js.map