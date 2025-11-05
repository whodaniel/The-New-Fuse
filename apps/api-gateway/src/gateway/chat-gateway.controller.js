"use strict";
/**
 * Chat Gateway Controller
 * Unified endpoint for chat and real-time communication
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
exports.ChatGatewayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proxy_service_1 = require("../proxy/proxy.service");
let ChatGatewayController = class ChatGatewayController {
    proxyService;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async getChatSessions(headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/chat/sessions', 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Chat service unavailable',
                error: errorMessage,
            });
        }
    }
    async createChatSession(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/chat/sessions', 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Chat service unavailable',
                error: errorMessage,
            });
        }
    }
    async getChatMessages(id, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/chat/sessions/${id}/messages`, 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Chat service unavailable',
                error: errorMessage,
            });
        }
    }
    async sendChatMessage(id, body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/chat/sessions/${id}/messages`, 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'Chat service unavailable',
                error: errorMessage,
            });
        }
    }
};
exports.ChatGatewayController = ChatGatewayController;
__decorate([
    (0, common_1.Get)('sessions'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat sessions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chat sessions retrieved successfully' }),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGatewayController.prototype, "getChatSessions", null);
__decorate([
    (0, common_1.Post)('sessions'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new chat session' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Chat session created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGatewayController.prototype, "createChatSession", null);
__decorate([
    (0, common_1.Get)('sessions/:id/messages'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages for a chat session' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Chat session ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Messages retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGatewayController.prototype, "getChatMessages", null);
__decorate([
    (0, common_1.Post)('sessions/:id/messages'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message to a chat session' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Chat session ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGatewayController.prototype, "sendChatMessage", null);
exports.ChatGatewayController = ChatGatewayController = __decorate([
    (0, common_1.Controller)('chat'),
    (0, swagger_1.ApiTags)('chat'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], ChatGatewayController);
//# sourceMappingURL=chat-gateway.controller.js.map