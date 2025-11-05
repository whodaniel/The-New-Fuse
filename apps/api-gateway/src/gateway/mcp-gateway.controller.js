"use strict";
/**
 * MCP Gateway Controller
 * Unified endpoint for Model Context Protocol operations
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
exports.McpGatewayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proxy_service_1 = require("../proxy/proxy.service");
let McpGatewayController = class McpGatewayController {
    proxyService;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async getMcpServers(headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/mcp/servers', 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'MCP service unavailable',
                error: errorMessage,
            });
        }
    }
    async registerMcpServer(body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/mcp/servers', 'POST', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'MCP service unavailable',
                error: errorMessage,
            });
        }
    }
    async getMcpServerStatus(id, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/mcp/servers/${id}/status`, 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'MCP service unavailable',
                error: errorMessage,
            });
        }
    }
    async updateMcpServer(id, body, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/mcp/servers/${id}`, 'PUT', headers, body);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'MCP service unavailable',
                error: errorMessage,
            });
        }
    }
    async removeMcpServer(id, headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', `/api/mcp/servers/${id}`, 'DELETE', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'MCP service unavailable',
                error: errorMessage,
            });
        }
    }
    async getMcpOAuthDiscovery(headers, res) {
        try {
            const response = await this.proxyService.proxyRequest('backend', '/api/mcp/oauth/discovery', 'GET', headers);
            return res.status(response.status).json(response.data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(common_1.HttpStatus.BAD_GATEWAY).json({
                message: 'MCP OAuth service unavailable',
                error: errorMessage,
            });
        }
    }
};
exports.McpGatewayController = McpGatewayController;
__decorate([
    (0, common_1.Get)('servers'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get MCP server configurations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'MCP servers retrieved successfully' }),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpGatewayController.prototype, "getMcpServers", null);
__decorate([
    (0, common_1.Post)('servers'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new MCP server' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'MCP server registered successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], McpGatewayController.prototype, "registerMcpServer", null);
__decorate([
    (0, common_1.Get)('servers/:id/status'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Get MCP server status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MCP server ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'MCP server status retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], McpGatewayController.prototype, "getMcpServerStatus", null);
__decorate([
    (0, common_1.Put)('servers/:id'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Update MCP server configuration' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MCP server ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'MCP server updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], McpGatewayController.prototype, "updateMcpServer", null);
__decorate([
    (0, common_1.Delete)('servers/:id'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove MCP server configuration' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'MCP server ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'MCP server removed successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], McpGatewayController.prototype, "removeMcpServer", null);
__decorate([
    (0, common_1.Get)('oauth/discovery'),
    (0, common_1.Version)('1'),
    (0, swagger_1.ApiOperation)({ summary: 'MCP OAuth Authorization Server discovery' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OAuth discovery metadata retrieved successfully' }),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpGatewayController.prototype, "getMcpOAuthDiscovery", null);
exports.McpGatewayController = McpGatewayController = __decorate([
    (0, common_1.Controller)('mcp'),
    (0, swagger_1.ApiTags)('mcp'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], McpGatewayController);
//# sourceMappingURL=mcp-gateway.controller.js.map