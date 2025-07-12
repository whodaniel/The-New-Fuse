var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentCommunicationBridge_1;
import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { RedisService } from '../redis/redis.service';
import { CircuitBreaker } from '../resilience/CircuitBreaker';
let AgentCommunicationBridge = AgentCommunicationBridge_1 = class AgentCommunicationBridge {
    redisService;
    websocketGateway;
    messageValidator;
    channels = new Map();
    logger = new Logger(AgentCommunicationBridge_1.name);
    circuitBreaker = new CircuitBreaker();
    constructor(redisService, websocketGateway, // WebSocketGateway instance
    messageValidator) {
        this.redisService = redisService;
        this.websocketGateway = websocketGateway;
        this.messageValidator = messageValidator;
        this.initializeRedisSubscriptions();
    }
    async broadcastMessage(message) {
        try {
            await this.messageValidator.validate(message);
            const channel = `agent:${message.recipient || 'broadcast'}`;
            await this.redisService.set(channel, JSON.stringify(message));
            this.logger.log('Message broadcasted', message);
            await this.logCommunication(message);
        }
        catch (error) {
            this.logger.error('Failed to broadcast message', { error, message });
            throw error;
        }
    }
    async sendDirectMessage(message) {
        try {
            await this.messageValidator.validate(message);
            const channel = `agent:${message.recipient}`;
            await this.redisService.publish(channel, JSON.stringify(message));
            this.logger.log('Direct message sent', message);
            await this.logCommunication(message);
        }
        catch (error) {
            this.logger.error('Failed to send direct message', { error, message });
            throw error;
        }
    }
    getAgentChannel(agentId) {
        if (!this.channels.has(agentId)) {
            this.channels.set(agentId, new Subject());
        }
        return this.channels.get(agentId).asObservable();
    }
    async initializeRedisSubscriptions() {
        const pattern = 'agent:*';
        // Note: This is a simplified implementation
        // In a real implementation, you'd use Redis pub/sub
        this.logger.log('Redis subscriptions initialized');
    }
    async logCommunication(message) {
        // Implementation for logging communications
        this.logger.log('Communication logged', {
            messageId: message.id,
            from: message.sender,
            to: message.recipient,
            type: message.type
        });
    }
};
AgentCommunicationBridge = AgentCommunicationBridge_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisService, Object, Object])
], AgentCommunicationBridge);
export { AgentCommunicationBridge };
