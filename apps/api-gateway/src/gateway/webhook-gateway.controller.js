"use strict";
/**
 * Webhook Gateway Controller
 * Unified endpoint for webhook and SSE operations
 */
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
exports.WebhookGatewayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proxy_service_1 = require("../proxy/proxy.service");
let WebhookGatewayController = class WebhookGatewayController {
    proxyService;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async registerWebhook(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('webhooks', '/webhooks/register', 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Webhook service unavailable',
                error: errorMessage,
            });
        }
    }
    async handleWebhook(source, body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('webhooks', `/webhooks/incoming/${source}`, 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Webhook service unavailable',
                error: errorMessage,
            });
        }
    }
    async getWebhookStatus(id, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('webhooks', `/webhooks/status/${id}`, 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Webhook service unavailable',
                error: errorMessage,
            });
        }
    }
    async getEventHistory(query, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('webhooks', '/webhooks/events/history', 'GET', headers, undefined, query);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Webhook service unavailable',
                error: errorMessage,
            });
        }
    }
    async streamEvents(query, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('webhooks', '/webhooks/events/stream', 'GET', headers, undefined, query);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Webhook service unavailable',
                error: errorMessage,
            });
        }
    }
};
exports.WebhookGatewayController = WebhookGatewayController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new webhook configuration' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Webhook registered successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookGatewayController.prototype, "registerWebhook", null);
__decorate([
    (0, common_1.Post)('incoming/:source'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Handle incoming webhook from integration source' }),
    (0, swagger_1.ApiParam)({ name: 'source', description: 'Integration source platform' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully' }),
    __param(0, (0, common_1.Param)('source')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookGatewayController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)('status/:id'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get webhook configuration status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Webhook configuration ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook status retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookGatewayController.prototype, "getWebhookStatus", null);
__decorate([
    (0, common_1.Get)('events/history'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get event history for organization' }),
    (0, swagger_1.ApiQuery)({ name: 'start_date', required: true, description: 'Start date (ISO 8601)' }),
    (0, swagger_1.ApiQuery)({ name: 'end_date', required: true, description: 'End date (ISO 8601)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Event history retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookGatewayController.prototype, "getEventHistory", null);
__decorate([
    (0, common_1.Get)('events/stream'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Stream real-time events via SSE' }),
    (0, swagger_1.ApiQuery)({ name: 'event_types', required: false, description: 'Event types filter' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'SSE stream established' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookGatewayController.prototype, "streamEvents", null);
exports.WebhookGatewayController = WebhookGatewayController = __decorate([
    (0, common_1.Controller)('webhooks'),
    (0, swagger_1.ApiTags)('webhooks'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], WebhookGatewayController);
//# sourceMappingURL=webhook-gateway.controller.js.map