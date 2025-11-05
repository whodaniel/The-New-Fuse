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
var TNFMCPController_1;
var _a;
import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { TNFMCPService } from './TNFMCPService';
let TNFMCPController = TNFMCPController_1 = class TNFMCPController {
    mcpService;
    logger = new Logger(TNFMCPController_1.name);
    constructor(mcpService) {
        this.mcpService = mcpService;
    }
    async getStatus() {
        return this.mcpService.getServerStatus();
    }
    async startRemoteServer(body) {
        const port = body.port || 3001;
        try {
            await this.mcpService.startRemoteServer(port);
            return {
                success: true,
                message: `MCP Server started on port ${port}`,
                port,
            };
        }
        catch (error) {
            this.logger.error('Failed to start remote server:', error);
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async getHealth() {
        const status = await this.mcpService.getServerStatus();
        return {
            status: status.initialized ? 'healthy' : 'unhealthy',
            details: status,
            timestamp: new Date().toISOString(),
        };
    }
};
__decorate([
    Get('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFMCPController.prototype, "getStatus", null);
__decorate([
    Post('start-remote'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TNFMCPController.prototype, "startRemoteServer", null);
__decorate([
    Get('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFMCPController.prototype, "getHealth", null);
TNFMCPController = TNFMCPController_1 = __decorate([
    Controller('mcp'),
    __metadata("design:paramtypes", [typeof (_a = typeof TNFMCPService !== "undefined" && TNFMCPService) === "function" ? _a : Object])
], TNFMCPController);
export { TNFMCPController };
//# sourceMappingURL=TNFMCPController.js.map