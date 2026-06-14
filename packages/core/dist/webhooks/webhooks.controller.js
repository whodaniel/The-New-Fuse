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
import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, HttpException, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookManagerService } from './webhook-manager.service.js';
let WebhooksController = class WebhooksController {
    constructor(webhookManager) {
        this.webhookManager = webhookManager;
    }
    async registerWebhook(webhookData) {
        try {
            const config = {
                url: webhookData.url,
                events: webhookData.events,
                headers: webhookData.headers || {},
                secret: webhookData.secret,
                active: webhookData.active ?? true,
                retryAttempts: webhookData.retryAttempts ?? 3,
                timeout: webhookData.timeout ?? 5000,
            };
            return await this.webhookManager.registerWebhook(config);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to register webhook', HttpStatus.BAD_REQUEST);
        }
    }
    async getAllWebhooks() {
        try {
            return await this.webhookManager.getAllWebhooks();
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get webhooks', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWebhook(id) {
        try {
            const webhook = await this.webhookManager.getWebhook(id);
            if (!webhook) {
                throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
            }
            return webhook;
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get webhook', HttpStatus.NOT_FOUND);
        }
    }
    async updateWebhook(id, updates) {
        try {
            const webhook = await this.webhookManager.updateWebhook(id, updates);
            if (!webhook) {
                throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
            }
            return webhook;
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to update webhook', HttpStatus.BAD_REQUEST);
        }
    }
    async deleteWebhook(id) {
        try {
            const deleted = await this.webhookManager.unregisterWebhook(id);
            if (!deleted) {
                throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
            }
            return { success: true };
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to delete webhook', HttpStatus.BAD_REQUEST);
        }
    }
    async triggerWebhooks(eventData) {
        try {
            await this.webhookManager.triggerWebhook(eventData.type, eventData.data);
            return { success: true };
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to trigger webhooks', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWebhookEvents(id) {
        try {
            return await this.webhookManager.getWebhookEvents(id);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get webhook events', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async retryFailedWebhooks() {
        try {
            await this.webhookManager.retryFailedWebhooks();
            return { success: true };
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to retry webhooks', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
__decorate([
    Post(),
    ApiOperation({ summary: 'Register a new webhook' }),
    ApiResponse({ status: 201, description: 'Webhook registered successfully' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "registerWebhook", null);
__decorate([
    Get(),
    ApiOperation({ summary: 'Get all webhooks' }),
    ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getAllWebhooks", null);
__decorate([
    Get(':id'),
    ApiOperation({ summary: 'Get a specific webhook' }),
    ApiResponse({ status: 200, description: 'Webhook retrieved successfully' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhook", null);
__decorate([
    Put(':id'),
    ApiOperation({ summary: 'Update a webhook' }),
    ApiResponse({ status: 200, description: 'Webhook updated successfully' }),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "updateWebhook", null);
__decorate([
    Delete(':id'),
    ApiOperation({ summary: 'Delete a webhook' }),
    ApiResponse({ status: 200, description: 'Webhook deleted successfully' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "deleteWebhook", null);
__decorate([
    Post('trigger'),
    ApiOperation({ summary: 'Trigger webhooks for an event' }),
    ApiResponse({ status: 200, description: 'Webhooks triggered successfully' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "triggerWebhooks", null);
__decorate([
    Get(':id/events'),
    ApiOperation({ summary: 'Get events for a webhook' }),
    ApiResponse({ status: 200, description: 'Webhook events retrieved successfully' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhookEvents", null);
__decorate([
    Post('retry-failed'),
    ApiOperation({ summary: 'Retry failed webhook deliveries' }),
    ApiResponse({ status: 200, description: 'Failed webhooks retried successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "retryFailedWebhooks", null);
WebhooksController = __decorate([
    ApiTags('webhooks'),
    Controller('webhooks'),
    __metadata("design:paramtypes", [WebhookManagerService])
], WebhooksController);
export { WebhooksController };
//# sourceMappingURL=webhooks.controller.js.map