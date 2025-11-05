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
var WebhooksController_1;
var _a, _b, _c, _d, _e, _f;
import { Controller, Post, Get, Body, Param, Query, Headers, UseGuards, Res, Req, Logger, HttpException, HttpStatus, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';
import { BusinessEventService } from './services/business-event.service';
import { SSEService } from './services/sse.service';
import { WebhookRegistrationRequest, EventHistoryRequest, IntegrationSource, } from '@the-new-fuse/types';
let WebhooksController = WebhooksController_1 = class WebhooksController {
    webhooksService;
    businessEventService;
    sseService;
    logger = new Logger(WebhooksController_1.name);
    constructor(webhooksService, businessEventService, sseService) {
        this.webhooksService = webhooksService;
        this.businessEventService = businessEventService;
        this.sseService = sseService;
    }
    async registerWebhook(request) {
        try {
            return await this.webhooksService.registerWebhook(request);
        }
        catch (error) {
            this.logger.error('Failed to register webhook', error);
            throw new HttpException('Failed to register webhook', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async handleWebhook(source, payload, headers) {
        try {
            const signature = this.extractSignature(headers, source);
            return await this.webhooksService.handleWebhook(source, payload, signature);
        }
        catch (error) {
            this.logger.error(`Failed to handle webhook from ${source}`, error);
            throw new HttpException('Failed to process webhook', HttpStatus.BAD_REQUEST);
        }
    }
    async getWebhookStatus(id) {
        try {
            return await this.webhooksService.getWebhookStatus(id);
        }
        catch (error) {
            this.logger.error(`Failed to get webhook status for ${id}`, error);
            throw new HttpException('Failed to retrieve webhook status', HttpStatus.NOT_FOUND);
        }
    }
    async getEventHistory(request, req) {
        try {
            const organizationId = req.user.organizationId;
            return await this.businessEventService.getEventHistory(organizationId, request);
        }
        catch (error) {
            this.logger.error('Failed to get event history', error);
            throw new HttpException('Failed to retrieve event history', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async streamEvents(req, res, eventTypes, filters) {
        try {
            const userId = req.user.id;
            const organizationId = req.user.organizationId;
            const clientId = `${userId}-${Date.now()}`;
            // Parse query parameters
            const parsedEventTypes = eventTypes ? eventTypes.split(',') : [];
            const parsedFilters = filters ? JSON.parse(filters) : {};
            // Set up SSE headers
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control',
            });
            // Add client to SSE service
            await this.sseService.addClient({
                id: clientId,
                userId,
                organizationId,
                subscriptions: [{
                        eventTypes: parsedEventTypes.map(type => type),
                        filters: parsedFilters,
                        priority: 'medium',
                    }],
                response: res,
                lastHeartbeat: new Date(),
            });
            // Handle client disconnect
            req.on('close', async () => {
                await this.sseService.removeClient(clientId);
            });
            // Send initial connection confirmation
            res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connected' })}\n\n`);
            // Keep connection alive with periodic heartbeats
            const heartbeatInterval = setInterval(() => {
                res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date() })}\n\n`);
            }, 30000);
            req.on('close', () => {
                clearInterval(heartbeatInterval);
            });
        }
        catch (error) {
            this.logger.error('Failed to establish SSE connection', error);
            res.status(500).json({ error: 'Failed to establish SSE connection' });
        }
    }
    async retryEvent(eventId) {
        try {
            await this.businessEventService.retryFailedEvent(eventId);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to retry event ${eventId}`, error);
            throw new HttpException('Failed to retry event', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    extractSignature(headers, source) {
        const signatureHeaders = {
            [IntegrationSource.STRIPE]: 'stripe-signature',
            [IntegrationSource.PAYPAL]: 'paypal-transmission-sig',
            [IntegrationSource.SALESFORCE]: 'x-salesforce-webhook-signature',
            [IntegrationSource.HUBSPOT]: 'x-hubspot-signature',
            [IntegrationSource.PIPEDRIVE]: 'x-pipedrive-signature',
            [IntegrationSource.SQUARE]: 'x-square-signature',
            [IntegrationSource.NETSUITE]: 'x-netsuite-signature',
            [IntegrationSource.SAP]: 'x-sap-signature',
            [IntegrationSource.QUICKBOOKS]: 'intuit-signature',
            [IntegrationSource.ZAPIER]: 'x-zapier-signature',
            [IntegrationSource.WORKATO]: 'x-workato-signature',
            [IntegrationSource.POWER_AUTOMATE]: 'x-ms-signature',
        };
        const headerName = signatureHeaders[source];
        if (!headerName) {
            throw new Error(`Unknown integration source: ${source}`);
        }
        const signature = headers[headerName] || headers[headerName.toLowerCase()];
        if (!signature) {
            throw new Error(`Missing signature header: ${headerName}`);
        }
        return signature;
    }
};
__decorate([
    Post('register'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Register a new webhook configuration' }),
    ApiResponse({ status: 201, description: 'Webhook registered successfully' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof WebhookRegistrationRequest !== "undefined" && WebhookRegistrationRequest) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "registerWebhook", null);
__decorate([
    Post('incoming/:source'),
    ApiOperation({ summary: 'Handle incoming webhook from integration source' }),
    ApiResponse({ status: 200, description: 'Webhook processed successfully' }),
    __param(0, Param('source')),
    __param(1, Body()),
    __param(2, Headers()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof IntegrationSource !== "undefined" && IntegrationSource) === "function" ? _e : Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleWebhook", null);
__decorate([
    Get('status/:id'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get webhook configuration status' }),
    ApiResponse({ status: 200, description: 'Webhook status retrieved' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhookStatus", null);
__decorate([
    Get('events/history'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Get event history for organization' }),
    ApiResponse({ status: 200, description: 'Event history retrieved' }),
    __param(0, Query()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof EventHistoryRequest !== "undefined" && EventHistoryRequest) === "function" ? _f : Object, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getEventHistory", null);
__decorate([
    Get('events/stream'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Stream real-time events via SSE' }),
    ApiResponse({ status: 200, description: 'SSE stream established' }),
    __param(0, Req()),
    __param(1, Res()),
    __param(2, Query('event_types')),
    __param(3, Query('filters')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "streamEvents", null);
__decorate([
    Post('events/:id/retry'),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Retry failed event processing' }),
    ApiResponse({ status: 200, description: 'Event retry initiated' }),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "retryEvent", null);
WebhooksController = WebhooksController_1 = __decorate([
    ApiTags('webhooks'),
    Controller('webhooks'),
    __metadata("design:paramtypes", [typeof (_a = typeof WebhooksService !== "undefined" && WebhooksService) === "function" ? _a : Object, typeof (_b = typeof BusinessEventService !== "undefined" && BusinessEventService) === "function" ? _b : Object, typeof (_c = typeof SSEService !== "undefined" && SSEService) === "function" ? _c : Object])
], WebhooksController);
export { WebhooksController };
//# sourceMappingURL=webhooks.controller.js.map