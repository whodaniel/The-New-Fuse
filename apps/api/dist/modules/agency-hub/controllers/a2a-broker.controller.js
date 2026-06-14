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
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AMessageBrokerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const secure_auth_guard_1 = require("../../../guards/secure-auth.guard");
const a2a_message_broker_service_1 = require("../services/a2a-message-broker.service");
let A2AMessageBrokerController = class A2AMessageBrokerController {
    constructor(brokerService) {
        this.brokerService = brokerService;
    }
    // ==================== MESSAGING ====================
    async sendMessage(body) {
        const messageId = await this.brokerService.sendMessage({
            type: body.type,
            from: body.from,
            to: body.to,
            payload: body.payload,
            priority: body.priority || a2a_message_broker_service_1.A2APriority.MEDIUM,
            correlationId: body.correlationId,
            ttl: body.ttl,
        });
        return { success: true, messageId };
    }
    async broadcastMessage(body) {
        const messageId = await this.brokerService.sendMessage({
            type: body.type,
            from: body.from,
            to: 'broadcast',
            payload: body.payload,
            priority: body.priority || a2a_message_broker_service_1.A2APriority.MEDIUM,
        });
        return { success: true, messageId };
    }
    async getPendingMessages(agentId, limit = 50) {
        const messages = await this.brokerService.getPendingMessages(agentId, limit);
        return { agentId, count: messages.length, messages };
    }
    async peekMessages(agentId, limit = 10) {
        const messages = await this.brokerService.peekMessages(agentId, limit);
        return { agentId, count: messages.length, messages };
    }
    // ==================== CHANNELS ====================
    async createChannel(body) {
        const channel = await this.brokerService.createChannel(body.name, body.participants || []);
        return { success: true, channel };
    }
    async joinChannel(channelName, body) {
        await this.brokerService.joinChannel(body.agentId, channelName);
        return { success: true, channel: channelName, agentId: body.agentId };
    }
    async leaveChannel(channelName, body) {
        await this.brokerService.leaveChannel(body.agentId, channelName);
        return { success: true, channel: channelName, agentId: body.agentId };
    }
    async sendToChannel(channelName, body) {
        const messageId = await this.brokerService.sendToChannel(channelName, {
            type: body.type,
            from: body.from,
            payload: body.payload,
            priority: body.priority || a2a_message_broker_service_1.A2APriority.MEDIUM,
        });
        return { success: true, messageId, channel: channelName };
    }
    // ==================== CONVERSATIONS ====================
    async startConversation(body) {
        const conversationId = await this.brokerService.startConversation(body.initiatorId, body.participantIds, body.topic);
        return { success: true, conversationId };
    }
    async sendConversationMessage(conversationId, body) {
        const messageId = await this.brokerService.sendConversationMessage(conversationId, body.fromAgent, body.content);
        return { success: true, messageId, conversationId };
    }
    // ==================== PRESENCE ====================
    async registerOnline(body) {
        await this.brokerService.registerPresence(body.agentId);
        return { success: true, agentId: body.agentId, status: 'online' };
    }
    async registerOffline(body) {
        await this.brokerService.unregisterPresence(body.agentId);
        return { success: true, agentId: body.agentId, status: 'offline' };
    }
    async getOnlineAgents() {
        const agents = this.brokerService.getOnlineAgents();
        return { count: agents.length, agents };
    }
    // ==================== STATUS & METRICS ====================
    async getStatus() {
        return this.brokerService.getStatus();
    }
    async getMetrics() {
        return this.brokerService.getMetrics();
    }
};
exports.A2AMessageBrokerController = A2AMessageBrokerController;
__decorate([
    (0, common_1.Post)('messages/send'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a direct message to an agent' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('messages/broadcast'),
    (0, swagger_1.ApiOperation)({ summary: 'Broadcast a message to all agents' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Broadcast sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "broadcastMessage", null);
__decorate([
    (0, common_1.Get)('messages/:agentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending messages for an agent' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Messages retrieved' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "getPendingMessages", null);
__decorate([
    (0, common_1.Get)('messages/:agentId/peek'),
    (0, swagger_1.ApiOperation)({ summary: 'Peek at pending messages without consuming them' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Messages peeked' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "peekMessages", null);
__decorate([
    (0, common_1.Post)('channels'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new communication channel' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Channel created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Post)('channels/:channelName/join'),
    (0, swagger_1.ApiOperation)({ summary: 'Join a communication channel' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Joined channel' }),
    __param(0, (0, common_1.Param)('channelName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "joinChannel", null);
__decorate([
    (0, common_1.Post)('channels/:channelName/leave'),
    (0, swagger_1.ApiOperation)({ summary: 'Leave a communication channel' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Left channel' }),
    __param(0, (0, common_1.Param)('channelName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "leaveChannel", null);
__decorate([
    (0, common_1.Post)('channels/:channelName/send'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message to a channel' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent to channel' }),
    __param(0, (0, common_1.Param)('channelName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "sendToChannel", null);
__decorate([
    (0, common_1.Post)('conversations'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a new conversation between agents' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Conversation started' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "startConversation", null);
__decorate([
    (0, common_1.Post)('conversations/:conversationId/message'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message in a conversation' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Conversation message sent' }),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "sendConversationMessage", null);
__decorate([
    (0, common_1.Post)('presence/online'),
    (0, swagger_1.ApiOperation)({ summary: 'Register agent as online' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent registered as online' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "registerOnline", null);
__decorate([
    (0, common_1.Post)('presence/offline'),
    (0, swagger_1.ApiOperation)({ summary: 'Register agent as offline' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent registered as offline' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "registerOffline", null);
__decorate([
    (0, common_1.Get)('presence/online'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of online agents' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Online agents retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "getOnlineAgents", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get broker status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Broker status retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get broker metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Broker metrics retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], A2AMessageBrokerController.prototype, "getMetrics", null);
exports.A2AMessageBrokerController = A2AMessageBrokerController = __decorate([
    (0, swagger_1.ApiTags)('a2a-broker'),
    (0, common_1.Controller)('a2a'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.USER),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [a2a_message_broker_service_1.A2AMessageBrokerService])
], A2AMessageBrokerController);
//# sourceMappingURL=a2a-broker.controller.js.map