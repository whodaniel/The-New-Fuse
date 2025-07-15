var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { MCPServer } from './MCPServer.tsx';
import { AgentService } from '../agents/agent.service.js';
import { APIToolRegistrar } from './APIToolRegistrar.js';
import { AgentAPIValidator } from './AgentAPIValidator.js';
const agentCapabilitySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    version: z.string(),
    parameters: z.record(z.unknown()).optional(),
    returns: z.record(z.unknown()).optional()
});
const messageSchema = z.object({
    sender: z.string(),
    recipient: z.string().optional(),
    type: z.enum(["broadcast", "direct"]),
    content: z.any(),
    metadata: z.record(z.string(), z.any()).optional()
});
let MCPAgentServer = class MCPAgentServer extends MCPServer {
    agentService;
    apiToolRegistrar;
    apiValidator;
    constructor(agentService, options = {}) {
        super({
            ...options,
            capabilities: {
                ...options.capabilities,
                registerCapability: {
                    description: "Register new agent capability",
                    parameters: agentCapabilitySchema,
                    execute: async (capability) => this.registerNewCapability(capability)
                },
                sendMessage: {
                    description: "Send message between agents",
                    parameters: messageSchema,
                    execute: async (message) => this.routeAgentMessage(message)
                },
                discoverAgents: {
                    description: "Discover available agents",
                    parameters: z.object({
                        filter: z.record(z.unknown()).optional()
                    }),
                    execute: async (params) => this.discoverAgents(params)
                }
            }
        });
        this.agentService = agentService;
        this.apiToolRegistrar = new APIToolRegistrar();
        this.apiValidator = new AgentAPIValidator();
    }
    async registerNewCapability(capability) {
        try {
            await this.validateCapability(capability);
            const registeredCap = await this.agentService.registerCapability(capability);
            await this.notifyCapabilityUpdate(registeredCap);
            return { success: true, capabilityId: registeredCap.id };
        }
        catch (error) {
            this.logger.error(`Error registering capability: ${error.message}`);
            throw error;
        }
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
            timestamp: Date.now()
        });
    }
};
MCPAgentServer = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentService !== "undefined" && AgentService) === "function" ? _a : Object, typeof (_b = typeof MCPServerOptions !== "undefined" && MCPServerOptions) === "function" ? _b : Object])
], MCPAgentServer);
export { MCPAgentServer };
