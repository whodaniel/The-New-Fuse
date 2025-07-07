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
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const webhooks_service_1 = require("./webhooks.service");
const business_event_service_1 = require("./services/business-event.service");
const sse_service_1 = require("./services/sse.service");
const types_1 = require("@the-new-fuse/types");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    webhooksService;
    businessEventService;
    sseService;
    logger = new common_1.Logger(WebhooksController_1.name);
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
            throw new common_1.HttpException('Failed to register webhook', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async handleWebhook(source, payload, headers) {
        try {
            const signature = this.extractSignature(headers, source);
            return await this.webhooksService.handleWebhook(source, payload, signature);
        }
        catch (error) {
            this.logger.error(`Failed to handle webhook from ${source}`, error);
            throw new common_1.HttpException('Failed to process webhook', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async getWebhookStatus(id) {
        try {
            return await this.webhooksService.getWebhookStatus(id);
        }
        catch (error) {
            this.logger.error(`Failed to get webhook status for ${id}`, error);
            throw new common_1.HttpException('Failed to retrieve webhook status', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getEventHistory(request, req) {
        try {
            const organizationId = req.user.organizationId;
            return await this.businessEventService.getEventHistory(organizationId, request);
        }
        catch (error) {
            this.logger.error('Failed to get event history', error);
            throw new common_1.HttpException('Failed to retrieve event history', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
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
                        eventTypes: parsedEventTypes,
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
            throw new common_1.HttpException('Failed to retry event', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    extractSignature(headers, source) {
        const signatureHeaders = {
            [types_1.IntegrationSource.STRIPE]: 'stripe-signature',
            [types_1.IntegrationSource.PAYPAL]: 'paypal-transmission-sig',
            [types_1.IntegrationSource.SALESFORCE]: 'x-salesforce-webhook-signature',
            [types_1.IntegrationSource.HUBSPOT]: 'x-hubspot-signature',
            [types_1.IntegrationSource.PIPEDRIVE]: 'x-pipedrive-signature',
            [types_1.IntegrationSource.SQUARE]: 'x-square-signature',
            [types_1.IntegrationSource.NETSUITE]: 'x-netsuite-signature',
            [types_1.IntegrationSource.SAP]: 'x-sap-signature',
            [types_1.IntegrationSource.QUICKBOOKS]: 'intuit-signature',
            [types_1.IntegrationSource.ZAPIER]: 'x-zapier-signature',
            [types_1.IntegrationSource.WORKATO]: 'x-workato-signature',
            [types_1.IntegrationSource.POWER_AUTOMATE]: 'x-ms-signature',
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
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new webhook configuration' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Webhook registered successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "registerWebhook", null);
__decorate([
    (0, common_1.Post)('incoming/:source'),
    (0, swagger_1.ApiOperation)({ summary: 'Handle incoming webhook from integration source' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully' }),
    __param(0, (0, common_1.Param)('source')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)('status/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get webhook configuration status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook status retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getWebhookStatus", null);
__decorate([
    (0, common_1.Get)('events/history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get event history for organization' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event history retrieved' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "getEventHistory", null);
__decorate([
    (0, common_1.Get)('events/stream'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Stream real-time events via SSE' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'SSE stream established' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('event_types')),
    __param(3, (0, common_1.Query)('filters')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "streamEvents", null);
__decorate([
    (0, common_1.Post)('events/:id/retry'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Retry failed event processing' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event retry initiated' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "retryEvent", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService,
        business_event_service_1.BusinessEventService,
        sse_service_1.SSEService])
], WebhooksController);
