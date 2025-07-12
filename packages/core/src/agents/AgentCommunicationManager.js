var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentCommunicationManager_1;
import { EventEmitter } from 'events';
import { Injectable, Logger } from '@nestjs/common';
import { MetricsProcessor } from '../security/metricsProcessor';
import { AgentCommunicationBridge } from './AgentCommunicationBridge';
let AgentCommunicationManager = AgentCommunicationManager_1 = class AgentCommunicationManager extends EventEmitter {
    communicationBridge;
    metricsProcessor;
    logger = new Logger(AgentCommunicationManager_1.name);
    channels = new Map();
    config;
    constructor(communicationBridge, metricsProcessor) {
        super();
        this.communicationBridge = communicationBridge;
        this.metricsProcessor = metricsProcessor;
        this.config = {
            level: 'info',
            type: 'direct',
            enabledProtocols: ['A2A_V2', 'MCP'],
            securityLevel: 'enhanced'
        };
        this.logger.log('AgentCommunicationManager initialized');
    }
    async createChannel(channelId, channelType, participants) {
        try {
            const channel = {
                id: channelId,
                name: `Channel_${channelId}`,
                channelType,
                participants,
                createdAt: new Date(),
                createdBy: 'system',
                isActive: true
            };
            this.channels.set(channelId, channel);
            this.emit('channelCreated', channel);
            this.logger.log('Communication channel created', { channelId, channelType });
            return channel;
        }
        catch (error) {
            this.logger.error('Failed to create channel', { error, channelId });
            throw error;
        }
    }
    async sendMessage(message, options = {}) {
        try {
            const priority = options.priority || 'medium';
            const protocol = options.protocol || 'A2A_V2';
            const fullMessage = {
                ...message,
                id: this.generateMessageId(),
                timestamp: new Date().toISOString(),
                priority
            };
            if (message.type === 'direct') {
                await this.communicationBridge.sendDirectMessage(fullMessage);
            }
            else {
                await this.communicationBridge.broadcastMessage(fullMessage);
            }
            this.logger.log('Message sent successfully', { messageId: fullMessage.id });
            this.emit('messageSent', fullMessage);
            // Track metrics
            await this.metricsProcessor.trackEvent('message_sent', {
                messageId: fullMessage.id,
                type: message.type,
                priority,
                protocol
            });
        }
        catch (error) {
            this.logger.error('Failed to send message', { error, message });
            this.emit('messageError', { error, message });
            throw error;
        }
    }
    async broadcastMessage(message, options = {}) {
        try {
            const priority = options.priority || 'medium';
            const protocol = options.protocol || 'A2A_V2';
            const broadcastMessage = {
                ...message,
                id: this.generateMessageId(),
                timestamp: new Date().toISOString(),
                type: 'broadcast',
                priority
            };
            await this.communicationBridge.broadcastMessage(broadcastMessage);
            this.logger.log('Broadcast message sent', { messageId: broadcastMessage.id });
            this.emit('messageBroadcast', broadcastMessage);
        }
        catch (error) {
            this.logger.error('Failed to broadcast message', { error, message });
            this.emit('broadcastError', { error, message });
            throw error;
        }
    }
    async closeChannel(channelId) {
        try {
            const channel = this.channels.get(channelId);
            if (channel) {
                channel.isActive = false;
                this.channels.set(channelId, channel);
                this.logger.log('Channel closed', { channelId });
                this.emit('channelClosed', channel);
            }
        }
        catch (error) {
            this.logger.error('Failed to close channel', { error, channelId });
            throw error;
        }
    }
    getChannel(channelId) {
        return this.channels.get(channelId);
    }
    getActiveChannels() {
        return Array.from(this.channels.values()).filter(channel => channel.isActive);
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
AgentCommunicationManager = AgentCommunicationManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AgentCommunicationBridge,
        MetricsProcessor])
], AgentCommunicationManager);
export { AgentCommunicationManager };
