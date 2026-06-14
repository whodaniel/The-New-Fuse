var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhookManagerService_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let WebhookManagerService = WebhookManagerService_1 = class WebhookManagerService {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(WebhookManagerService_1.name);
        this.webhooks = new Map();
        this.events = new Map();
    }
    async registerWebhook(config) {
        const webhook = {
            id: this.generateId(),
            ...config
        };
        this.webhooks.set(webhook.id, webhook);
        this.eventEmitter.emit('webhook.registered', webhook);
        return webhook;
    }
    async unregisterWebhook(webhookId) {
        const deleted = this.webhooks.delete(webhookId);
        if (deleted) {
            this.eventEmitter.emit('webhook.unregistered', { webhookId });
        }
        return deleted;
    }
    async updateWebhook(webhookId, updates) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook)
            return null;
        const updatedWebhook = { ...webhook, ...updates };
        this.webhooks.set(webhookId, updatedWebhook);
        this.eventEmitter.emit('webhook.updated', updatedWebhook);
        return updatedWebhook;
    }
    async getWebhook(webhookId) {
        return this.webhooks.get(webhookId) || null;
    }
    async getAllWebhooks() {
        return Array.from(this.webhooks.values());
    }
    async triggerWebhook(eventType, data) {
        const relevantWebhooks = Array.from(this.webhooks.values())
            .filter(webhook => webhook.active && webhook.events.includes(eventType));
        for (const webhook of relevantWebhooks) {
            const event = {
                id: this.generateId(),
                type: eventType,
                data,
                timestamp: new Date(),
                webhookId: webhook.id,
                status: 'pending',
                attempts: 0
            };
            this.events.set(event.id, event);
            this.sendWebhook(event, webhook);
        }
    }
    async sendWebhook(event, webhook) {
        try {
            // Mock webhook sending - replace with actual HTTP request
            await new Promise(resolve => setTimeout(resolve, 100));
            event.status = 'sent';
            event.attempts += 1;
            event.lastAttempt = new Date();
            this.events.set(event.id, event);
            this.eventEmitter.emit('webhook.sent', { event, webhook });
            this.logger.log(`Webhook sent successfully: ${webhook.url}`);
        }
        catch (error) {
            event.status = 'failed';
            event.error = error.message;
            event.attempts += 1;
            event.lastAttempt = new Date();
            this.events.set(event.id, event);
            this.eventEmitter.emit('webhook.failed', { event, webhook, error });
            this.logger.error(`Webhook failed: ${webhook.url}`, error);
        }
    }
    async getWebhookEvents(webhookId) {
        const events = Array.from(this.events.values());
        return webhookId ? events.filter(e => e.webhookId === webhookId) : events;
    }
    async retryFailedWebhooks() {
        const failedEvents = Array.from(this.events.values())
            .filter(event => event.status === 'failed' && event.attempts < 3);
        for (const event of failedEvents) {
            const webhook = this.webhooks.get(event.webhookId);
            if (webhook) {
                event.status = 'retrying';
                this.sendWebhook(event, webhook);
            }
        }
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};
WebhookManagerService = WebhookManagerService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], WebhookManagerService);
export { WebhookManagerService };
//# sourceMappingURL=webhook-manager.service.js.map