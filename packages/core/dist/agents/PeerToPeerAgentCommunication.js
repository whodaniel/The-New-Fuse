var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PeerToPeerAgentCommunication_1;
import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
let PeerToPeerAgentCommunication = PeerToPeerAgentCommunication_1 = class PeerToPeerAgentCommunication {
    constructor() {
        this.logger = new Logger(PeerToPeerAgentCommunication_1.name);
        this.channels = new Map();
        this.channelMeta = new Map();
        this.pendingResponses = new Map();
        this.messageHistory = new Map();
        this.maxHistoryPerChannel = 100;
    }
    establishChannel(agentA, agentB) {
        const channelId = this.getChannelId(agentA, agentB);
        if (this.channels.has(channelId)) {
            return this.channelMeta.get(channelId);
        }
        const subject = new Subject();
        this.channels.set(channelId, subject);
        const meta = {
            agentA,
            agentB,
            established: true,
            createdAt: new Date().toISOString(),
            messageCount: 0,
        };
        this.channelMeta.set(channelId, meta);
        this.messageHistory.set(channelId, []);
        this.logger.log(`P2P channel established: ${agentA} <-> ${agentB}`);
        return meta;
    }
    async sendPrompt(sender, recipient, content, timeoutMs = 30000) {
        const channelId = this.getChannelId(sender, recipient);
        this.establishChannel(sender, recipient);
        const correlationId = `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            sender,
            recipient,
            type: 'prompt',
            content,
            correlationId,
            timestamp: new Date().toISOString(),
        };
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingResponses.delete(correlationId);
                reject(new Error(`P2P prompt timed out after ${timeoutMs}ms: ${correlationId}`));
            }, timeoutMs);
            this.pendingResponses.set(correlationId, { resolve, reject, timeout: timer });
            this.emitMessage(channelId, message);
        });
    }
    sendResponse(originalMessage, responseContent) {
        const channelId = this.getChannelId(originalMessage.sender, originalMessage.recipient);
        const response = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            sender: originalMessage.recipient,
            recipient: originalMessage.sender,
            type: 'response',
            content: responseContent,
            correlationId: originalMessage.correlationId,
            timestamp: new Date().toISOString(),
        };
        this.emitMessage(channelId, response);
        if (originalMessage.correlationId) {
            const pending = this.pendingResponses.get(originalMessage.correlationId);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingResponses.delete(originalMessage.correlationId);
                pending.resolve(response);
            }
        }
    }
    subscribeToPrompts(agentId, handler) {
        const matchingChannels = [];
        for (const [channelId, meta] of this.channelMeta) {
            if (meta.agentA === agentId || meta.agentB === agentId) {
                matchingChannels.push(channelId);
            }
        }
        const subject = new Subject();
        for (const channelId of matchingChannels) {
            const channel = this.channels.get(channelId);
            if (channel) {
                channel.subscribe((msg) => {
                    if (msg.recipient === agentId && msg.type === 'prompt') {
                        subject.next(msg);
                    }
                });
            }
        }
        return subject.subscribe(handler);
    }
    getChannelInfo(agentA, agentB) {
        return this.channelMeta.get(this.getChannelId(agentA, agentB));
    }
    getHistory(agentA, agentB) {
        return this.messageHistory.get(this.getChannelId(agentA, agentB)) || [];
    }
    closeChannel(agentA, agentB) {
        const channelId = this.getChannelId(agentA, agentB);
        const subject = this.channels.get(channelId);
        if (subject) {
            subject.complete();
            this.channels.delete(channelId);
        }
        this.channelMeta.delete(channelId);
        this.messageHistory.delete(channelId);
        this.logger.log(`P2P channel closed: ${agentA} <-> ${agentB}`);
    }
    getActiveChannels() {
        return Array.from(this.channelMeta.values()).filter((c) => c.established);
    }
    async shutdown() {
        for (const [correlationId, pending] of this.pendingResponses) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('P2P communication shutting down'));
        }
        this.pendingResponses.clear();
        for (const [channelId, subject] of this.channels) {
            subject.complete();
        }
        this.channels.clear();
        this.channelMeta.clear();
        this.messageHistory.clear();
        this.logger.log('PeerToPeerAgentCommunication shutdown complete');
    }
    emitMessage(channelId, message) {
        const subject = this.channels.get(channelId);
        if (!subject) {
            throw new Error(`P2P channel not found: ${channelId}`);
        }
        subject.next(message);
        const meta = this.channelMeta.get(channelId);
        if (meta) {
            meta.messageCount++;
        }
        const history = this.messageHistory.get(channelId) || [];
        history.push(message);
        if (history.length > this.maxHistoryPerChannel) {
            history.shift();
        }
        this.messageHistory.set(channelId, history);
    }
    getChannelId(agentA, agentB) {
        return [agentA, agentB].sort().join('::p2p::');
    }
};
PeerToPeerAgentCommunication = PeerToPeerAgentCommunication_1 = __decorate([
    Injectable()
], PeerToPeerAgentCommunication);
export { PeerToPeerAgentCommunication };
//# sourceMappingURL=PeerToPeerAgentCommunication.js.map