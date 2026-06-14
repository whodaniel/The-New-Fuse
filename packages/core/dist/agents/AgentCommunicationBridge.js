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
let AgentCommunicationBridge = AgentCommunicationBridge_1 = class AgentCommunicationBridge {
    constructor() {
        this.channels = new Map();
        this.logger = new Logger(AgentCommunicationBridge_1.name);
        this.messageQueue = new Map();
        this.logger.log('AgentCommunicationBridge initialized');
    }
    async sendMessage(message) {
        try {
            this.logger.debug(`Sending message from ${message.sender} to ${message.recipient}`);
            // Get or create channel for recipient
            const channel = this.getOrCreateChannel(message.recipient);
            // Add timestamp if not provided
            if (!message.timestamp) {
                message.timestamp = new Date().toISOString();
            }
            // Emit message to channel
            channel.next(message);
            this.logger.debug(`Message sent successfully: ${message.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to send message: ${message.id}`, error);
            throw error;
        }
    }
    subscribeToMessages(agentId) {
        const channel = this.getOrCreateChannel(agentId);
        this.logger.debug(`Agent ${agentId} subscribed to messages`);
        return channel.asObservable();
    }
    async sendDirectMessage(message) {
        return this.sendMessage(message);
    }
    async broadcastMessage(message) {
        const broadcastMessage = {
            ...message,
            recipient: 'all',
            type: 'broadcast'
        };
        return this.sendMessage(broadcastMessage);
    }
    async validateMessage(message) {
        // Basic validation
        if (!message.id || !message.sender || !message.recipient) {
            return false;
        }
        if (!message.type || !['direct', 'broadcast', 'task_request', 'task_response', 'status_update', 'error'].includes(message.type)) {
            return false;
        }
        if (!message.priority || !['low', 'medium', 'high'].includes(message.priority)) {
            return false;
        }
        return true;
    }
    getOrCreateChannel(agentId) {
        if (!this.channels.has(agentId)) {
            this.channels.set(agentId, new Subject());
            this.logger.debug(`Created new channel for agent: ${agentId}`);
        }
        return this.channels.get(agentId);
    }
    getActiveChannels() {
        return Array.from(this.channels.keys());
    }
    closeChannel(agentId) {
        const channel = this.channels.get(agentId);
        if (channel) {
            channel.complete();
            this.channels.delete(agentId);
            this.logger.debug(`Closed channel for agent: ${agentId}`);
        }
    }
    async shutdown() {
        this.logger.log('Shutting down AgentCommunicationBridge...');
        // Close all channels
        for (const [agentId, channel] of this.channels) {
            channel.complete();
            this.logger.debug(`Closed channel for agent: ${agentId}`);
        }
        this.channels.clear();
        this.logger.log('AgentCommunicationBridge shutdown complete');
    }
};
AgentCommunicationBridge = AgentCommunicationBridge_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], AgentCommunicationBridge);
export { AgentCommunicationBridge };
//# sourceMappingURL=AgentCommunicationBridge.js.map