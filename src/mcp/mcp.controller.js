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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPController = void 0;
const common_1 = require("@nestjs/common");
const mcp_service_1 = require("./mcp.service");
let MCPController = class MCPController {
    mcpService;
    constructor(mcpService) {
        this.mcpService = mcpService;
    }
    async getHealth() {
        return this.mcpService.getHealth();
    }
    async getInfo() {
        return this.mcpService.getInfo();
    }
    async getDiscovery() {
        return this.mcpService.getDiscovery();
    }
    async listServers(query) {
        return this.mcpService.listServers(query);
    }
    async addServer(serverData) {
        return this.mcpService.addServer(serverData);
    }
    async removeServer(name, options) {
        return this.mcpService.removeServer(name, options);
    }
    async validateConfiguration(config) {
        return this.mcpService.validateConfiguration(config);
    }
};
exports.MCPController = MCPController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "getInfo", null);
__decorate([
    (0, common_1.Get)('mcp/discovery'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "getDiscovery", null);
__decorate([
    (0, common_1.Get)('api/config/servers'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "listServers", null);
__decorate([
    (0, common_1.Post)('api/config/servers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "addServer", null);
__decorate([
    (0, common_1.Delete)('api/config/servers/:name'),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "removeServer", null);
__decorate([
    (0, common_1.Post)('api/config/validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MCPController.prototype, "validateConfiguration", null);
exports.MCPController = MCPController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [mcp_service_1.MCPService])
], MCPController);
//# sourceMappingURL=mcp.controller.js.map