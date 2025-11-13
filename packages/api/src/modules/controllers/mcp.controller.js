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
var _a;
import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MCPService } from '../services/mcp.service';
let MCPController = class MCPController {
    mcpService;
    constructor(mcpService) {
        this.mcpService = mcpService;
    }
    async registerServer(dto) {
        try {
            const { name, server } = dto;
            if (!name || !server) {
                return {
                    success: false,
                    error: 'Server name and server object are required'
                };
            }
            this.mcpService.registerServer(name, server);
            return {
                success: true,
                message: `Server ${name} registered successfully`
            };
        }
        catch (error) {
            console.error('Error registering MCP server:', error);
            return {
                success: false,
                error: error.message || 'Failed to register MCP server'
            };
        }
    }
    async getServers() {
        const servers = this.mcpService.getServers();
        const status = await this.mcpService.getServerStatus();
        return {
            success: true,
            data: servers
        };
    }
    async getServerStatus() {
        const status = await this.mcpService.getServerStatus();
        return {
            success: true,
            data: status
        };
    }
    getCapabilities() {
        const capabilities = this.mcpService.getAllCapabilities();
        return {
            success: true,
            data: capabilities
        };
    }
    getTools() {
        const tools = this.mcpService.getAllTools();
        return {
            success: true,
            data: tools
        };
    }
    async executeDirective(dto, req) {
        try {
            const { serverName, action, params, metadata } = dto;
            if (!serverName || !action) {
                return {
                    success: false,
                    error: 'Server name and action are required'
                };
            }
            const sender = req.user?.id || 'anonymous';
            const result = await this.mcpService.executeDirective(serverName, action, params || {}, {
                sender,
                metadata: metadata || {}
            });
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            console.error('Error executing MCP directive:', error);
            return {
                success: false,
                error: error.message || 'Failed to execute MCP directive'
            };
        }
    }
};
__decorate([
    Post('servers'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "registerServer", null);
__decorate([
    Get('servers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "getServers", null);
__decorate([
    Get('servers/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "getServerStatus", null);
__decorate([
    Get('capabilities'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getCapabilities", null);
__decorate([
    Get('tools'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MCPController.prototype, "getTools", null);
__decorate([
    Post('execute'),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "executeDirective", null);
MCPController = __decorate([
    Controller('api/mcp'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof MCPService !== "undefined" && MCPService) === "function" ? _a : Object])
], MCPController);
export { MCPController };
//# sourceMappingURL=mcp.controller.js.map