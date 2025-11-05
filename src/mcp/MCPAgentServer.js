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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPAgentServer = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const MCPServer_1 = require("./MCPServer");
const agent_service_1 = require("../agents/agent.service");
const APIToolRegistrar_1 = require("./APIToolRegistrar");
const AgentAPIValidator_1 = require("./AgentAPIValidator");
const agentCapabilitySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    version: zod_1.z.string(),
    parameters: zod_1.z.record(zod_1.z.unknown()).optional(),
    returns: zod_1.z.record(zod_1.z.unknown()).optional()
});
const messageSchema = zod_1.z.object({
    sender: zod_1.z.string(),
    recipient: zod_1.z.string().optional(),
    type: zod_1.z.enum(["broadcast", "direct"]),
    content: zod_1.z.any(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
});
let MCPAgentServer = class MCPAgentServer extends MCPServer_1.MCPServer {
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
                    parameters: zod_1.z.object({
                        filter: zod_1.z.record(zod_1.z.unknown()).optional()
                    }),
                    execute: async (params) => this.discoverAgents(params)
                }
            }
        });
        this.agentService = agentService;
        this.apiToolRegistrar = new APIToolRegistrar_1.APIToolRegistrar();
        this.apiValidator = new AgentAPIValidator_1.AgentAPIValidator();
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
exports.MCPAgentServer = MCPAgentServer;
exports.MCPAgentServer = MCPAgentServer = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof agent_service_1.AgentService !== "undefined" && agent_service_1.AgentService) === "function" ? _a : Object, typeof (_b = typeof MCPServerOptions !== "undefined" && MCPServerOptions) === "function" ? _b : Object])
], MCPAgentServer);
//# sourceMappingURL=MCPAgentServer.js.map