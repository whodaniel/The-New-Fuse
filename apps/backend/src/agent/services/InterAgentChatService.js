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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterAgentChatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const redis_service_1 = require("../../services/redis.service");
const AlertService_1 = require("./AlertService");
const MonitoringService_1 = require("./MonitoringService");
let InterAgentChatService = class InterAgentChatService {
    configService;
    redisService;
    alertService;
    monitoringService;
    eventEmitter;
    channelPrefix = 'agent-chat';
    agentId;
    constructor(configService, redisService, alertService, monitoringService, eventEmitter) {
        this.configService = configService;
        this.redisService = redisService;
        this.alertService = alertService;
        this.monitoringService = monitoringService;
        this.eventEmitter = eventEmitter;
        this.agentId = this.configService.get('AGENT_ID') || 'unknown-agent';
    }
    async onModuleInit() {
        // Subscribe to messages directed to this agent
        await this.subscribeToAgentChannel();
    }
    /**
     * Subscribe to the agent's message channel
     */
    async subscribeToAgentChannel() {
        const channel = `${this.channelPrefix}:${this.agentId}`;
        try {
            await this.redisService.subscribe(channel);
            this.monitoringService.logEvent('agent.channel.subscribed', { agentId: this.agentId, channel });
        }
        catch (error) {
            this.alertService.error('agent.channel.subscribe.failed', `Failed to subscribe to channel ${channel}`, { error: error.message });
        }
    }
    /**
     * Handle an incoming message from another agent
     */
    handleIncomingMessage(message) {
        // Validate message
        if (!message || !message.from || !message.content) {
            this.alertService.warning('agent.message.invalid', 'Received invalid message format');
            return;
        }
        // Emit event for message handlers
        this.eventEmitter.emit('agent.message.received', message);
        // Record metric
        this.monitoringService.recordMetric('agent.messages.received', 1, { from: message.from });
    }
    /**
     * Send a message to another agent
     */
    async sendMessage(toAgentId, content, metadata = {}) {
        const messageId = this.generateMessageId();
        const channel = `${this.channelPrefix}:${toAgentId}`;
        const message = {
            id: messageId,
            from: this.agentId,
            to: toAgentId,
            content,
            timestamp: new Date(),
            metadata,
        };
        try {
            await this.redisService.publish(channel, JSON.stringify(message));
            // Record metric
            this.monitoringService.recordMetric('agent.messages.sent', 1, { to: toAgentId });
            // Emit event
            this.eventEmitter.emit('agent.message.sent', message);
            return messageId;
        }
        catch (error) {
            this.alertService.error('agent.message.send.failed', `Failed to send message to agent ${toAgentId}`, { error: error.message });
            throw error;
        }
    }
    /**
     * Broadcast a message to all agents
     */
    async broadcastMessage(content, metadata = {}) {
        const messageId = this.generateMessageId();
        const channel = `${this.channelPrefix}:broadcast`;
        const message = {
            id: messageId,
            from: this.agentId,
            to: 'broadcast',
            content,
            timestamp: new Date(),
            metadata,
        };
        try {
            await this.redisService.publish(channel, JSON.stringify(message));
            // Record metric
            this.monitoringService.recordMetric('agent.messages.broadcast', 1);
            // Emit event
            this.eventEmitter.emit('agent.message.broadcast', message);
            return messageId;
        }
        catch (error) {
            this.alertService.error('agent.message.broadcast.failed', 'Failed to broadcast message', { error: error.message });
            throw error;
        }
    }
    /**
     * Generate a unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Check if the agent chat service is healthy
     */
    async checkHealth() {
        try {
            const redisHealth = await this.redisService.get('health-check');
            if (!redisHealth || redisHealth !== 'healthy') {
                return {
                    status: 'unhealthy',
                    details: { redis: redisHealth || 'unreachable' },
                };
            }
            return { status: 'healthy' };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: error.message,
            };
        }
    }
};
exports.InterAgentChatService = InterAgentChatService;
exports.InterAgentChatService = InterAgentChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService,
        AlertService_1.AlertService,
        MonitoringService_1.MonitoringService,
        event_emitter_1.EventEmitter2])
], InterAgentChatService);
