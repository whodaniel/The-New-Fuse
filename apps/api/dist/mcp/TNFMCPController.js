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
var TNFMCPController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TNFMCPController = void 0;
const common_1 = require("@nestjs/common");
const TNFMCPService_1 = require("./TNFMCPService");
let TNFMCPController = TNFMCPController_1 = class TNFMCPController {
    constructor(mcpService) {
        this.mcpService = mcpService;
        this.logger = new common_1.Logger(TNFMCPController_1.name);
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
    async getMarketplaceServers() {
        return [
            {
                id: 'vscode-mcp-server',
                name: 'VS Code MCP Server',
                description: 'Enables AI agents to interact with Visual Studio Code through the Model Context Protocol',
                version: '1.2.0',
                publisher: 'MCP Foundation',
                category: 'Development Tools',
                rating: 4.8,
                downloads: 12503,
                lastUpdated: '2025-04-01',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/vscode-mcp-server'],
                capabilities: ['Code editing', 'File operations', 'Terminal commands', 'Diagnostics'],
                requiresConfiguration: false,
            },
            {
                id: 'filesystem-mcp-server',
                name: 'Filesystem MCP Server',
                description: 'Provides secure filesystem access for AI agents through the Model Context Protocol',
                version: '0.9.5',
                publisher: 'MCP Foundation',
                category: 'File Management',
                rating: 4.6,
                downloads: 8921,
                lastUpdated: '2025-03-15',
                installCommand: 'npx',
                args: ['@modelcontextprotocol/server-filesystem', '--allow-dir', './data'],
                capabilities: ['File read', 'File write', 'Directory listing', 'File search'],
                requiresConfiguration: true,
                configurationSchema: {
                    type: 'object',
                    required: ['allowedDirectories'],
                    properties: {
                        allowedDirectories: {
                            type: 'string',
                            description: 'Comma-separated list of directories to allow access to',
                        },
                    },
                },
            },
        ];
    }
    async installServer(body) {
        const { serverId, configuration } = body;
        // Mock installation process
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return { success: true, message: `Server ${serverId} installed successfully` };
    }
};
exports.TNFMCPController = TNFMCPController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFMCPController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('start-remote'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TNFMCPController.prototype, "startRemoteServer", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFMCPController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('marketplace'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TNFMCPController.prototype, "getMarketplaceServers", null);
__decorate([
    (0, common_1.Post)('install'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TNFMCPController.prototype, "installServer", null);
exports.TNFMCPController = TNFMCPController = TNFMCPController_1 = __decorate([
    (0, common_1.Controller)('mcp'),
    __metadata("design:paramtypes", [TNFMCPService_1.TNFMCPService])
], TNFMCPController);
//# sourceMappingURL=TNFMCPController.js.map