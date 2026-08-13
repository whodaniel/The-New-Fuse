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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var A2AController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AController = void 0;
const common_1 = require("@nestjs/common");
const a2a_service_js_1 = require("./a2a.service.js");
const types_js_1 = require("./types.js");
let A2AController = A2AController_1 = class A2AController {
    constructor(a2aService) {
        this.a2aService = a2aService;
        this.logger = new common_1.Logger(A2AController_1.name);
    }
    // Agent Management
    async registerAgent(registration) {
        this.logger.log(`Registering agent: ${registration.agentId}`);
        await this.a2aService.registerAgent(registration);
        return { success: true, message: 'Agent registered successfully' };
    }
    async unregisterAgent(agentId) {
        this.logger.log(`Unregistering agent: ${agentId}`);
        await this.a2aService.unregisterAgent(agentId);
    }
    async updateAgentStatus(agentId, body) {
        await this.a2aService.updateAgentStatus(agentId, body.status);
        return { success: true, message: 'Agent status updated' };
    }
    async discoverAgents(type, capabilities, status) {
        const criteria = {};
        if (type)
            criteria.type = type;
        if (status)
            criteria.status = status;
        if (capabilities) {
            criteria.capabilities = capabilities.split(',').map(c => c.trim());
        }
        const agents = await this.a2aService.discoverAgents(criteria);
        return { agents, count: agents.length };
    }
    async getOnlineAgents() {
        const agents = await this.a2aService.getOnlineAgents();
        return { agents, count: agents.length };
    }
    async getAgentHealth(agentId) {
        const health = await this.a2aService.getAgentHealth(agentId);
        if (!health) {
            return { status: 'unknown', message: 'No health data available' };
        }
        return health;
    }
    // Messaging
    async sendMessage(message) {
        await this.a2aService.sendMessage(message);
        return { success: true, messageId: message.id };
    }
    async sendRequest(body) {
        const response = await this.a2aService.sendRequest(body.fromAgent, body.toAgent, body.payload, {
            timeout: body.timeout,
            priority: body.priority,
            conversationId: body.conversationId
        });
        return { response };
    }
    async broadcast(body) {
        await this.a2aService.broadcast(body.fromAgent, body.payload, {
            channel: body.channel,
            topic: body.topic,
            priority: body.priority
        });
        return { success: true, message: 'Broadcast sent' };
    }
    async sendResponse(body) {
        await this.a2aService.sendResponse(body.originalMessage, body.responsePayload, body.fromAgent);
        return { success: true, message: 'Response sent' };
    }
    // Conversations
    async startConversation(body) {
        const conversationId = await this.a2aService.startConversation([body.initiator, ...body.participants], { topic: body.topic });
        return { conversationId };
    }
    async joinConversation(conversationId, body) {
        await this.a2aService.joinConversation(conversationId, body.agentId);
        return { success: true, message: 'Joined conversation' };
    }
    async leaveConversation(conversationId, body) {
        await this.a2aService.leaveConversation(conversationId, body.agentId);
        return { success: true, message: 'Left conversation' };
    }
    // Advanced Features
    async facilitateHandshake(body) {
        await this.a2aService.facilitateAgentHandshake(body.agent1Id, body.agent2Id);
        return { success: true, message: 'Handshake facilitated' };
    }
    async routeMessageByCapability(body) {
        await this.a2aService.routeMessageByCapability(body.fromAgent, body.targetCapability, body.payload, {
            priority: body.priority,
            preferredAgent: body.preferredAgent
        });
        return { success: true, message: 'Message routed by capability' };
    }
    async createCommunicationChannel(body) {
        const conversationId = await this.a2aService.createAgentCommunicationChannel(body.agentIds, body.topic);
        return { conversationId };
    }
    // Health and Monitoring
    async sendHeartbeat(agentId, heartbeat) {
        const fullHeartbeat = {
            ...heartbeat,
            agentId,
            timestamp: new Date().toISOString()
        };
        await this.a2aService.sendHeartbeat(fullHeartbeat);
        return { success: true, message: 'Heartbeat sent' };
    }
    async getSystemStats() {
        const stats = await this.a2aService.getSystemStats();
        return stats;
    }
    async getConnectionStatus() {
        const websocketAgents = this.a2aService.getConnectedWebSocketAgents();
        return {
            websocketConnections: websocketAgents,
            totalConnected: websocketAgents.length
        };
    }
    async createPayment(paymentDetails) {
        return this.a2aService.createPayment(paymentDetails);
    }
    // Utility endpoints
    async findAgentsByCapability(capabilityName) {
        const agents = await this.a2aService.findAgentsByCapability(capabilityName);
        return { agents, count: agents.length };
    }
    async isAgentConnected(agentId) {
        const connected = this.a2aService.isAgentConnectedViaWebSocket(agentId);
        return { agentId, connected };
    }
};
exports.A2AController = A2AController;
__decorate([
    (0, common_1.Post)('agents/register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "registerAgent", null);
__decorate([
    (0, common_1.Delete)('agents/:agentId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "unregisterAgent", null);
__decorate([
    (0, common_1.Put)('agents/:agentId/status'),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "updateAgentStatus", null);
__decorate([
    (0, common_1.Get)('agents'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('capabilities')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "discoverAgents", null);
__decorate([
    (0, common_1.Get)('agents/online'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "getOnlineAgents", null);
__decorate([
    (0, common_1.Get)('agents/:agentId/health'),
    __param(0, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "getAgentHealth", null);
__decorate([
    (0, common_1.Post)('messages/send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('messages/request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "sendRequest", null);
__decorate([
    (0, common_1.Post)('messages/broadcast'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "broadcast", null);
__decorate([
    (0, common_1.Post)('messages/response'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "sendResponse", null);
__decorate([
    (0, common_1.Post)('conversations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "startConversation", null);
__decorate([
    (0, common_1.Post)('conversations/:conversationId/join'),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "joinConversation", null);
__decorate([
    (0, common_1.Post)('conversations/:conversationId/leave'),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "leaveConversation", null);
__decorate([
    (0, common_1.Post)('agents/handshake'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "facilitateHandshake", null);
__decorate([
    (0, common_1.Post)('messages/route-by-capability'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "routeMessageByCapability", null);
__decorate([
    (0, common_1.Post)('agents/channel'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "createCommunicationChannel", null);
__decorate([
    (0, common_1.Post)('agents/:agentId/heartbeat'),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "sendHeartbeat", null);
__decorate([
    (0, common_1.Get)('system/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "getSystemStats", null);
__decorate([
    (0, common_1.Get)('system/connections'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "getConnectionStatus", null);
__decorate([
    (0, common_1.Post)('payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)('agents/capabilities/:capabilityName'),
    __param(0, (0, common_1.Param)('capabilityName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "findAgentsByCapability", null);
__decorate([
    (0, common_1.Get)('agents/:agentId/connected'),
    __param(0, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], A2AController.prototype, "isAgentConnected", null);
exports.A2AController = A2AController = A2AController_1 = __decorate([
    (0, common_1.Controller)('a2a'),
    __metadata("design:paramtypes", [a2a_service_js_1.A2AService])
], A2AController);
//# sourceMappingURL=a2a.controller.js.map