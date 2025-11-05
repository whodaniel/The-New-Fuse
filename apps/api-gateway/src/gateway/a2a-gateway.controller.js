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
exports.A2AGatewayController = void 0;
const common_1 = require("@nestjs/common");
const proxy_service_1 = require("../proxy/proxy.service");
let A2AGatewayController = class A2AGatewayController {
    proxyService;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    health() {
        return {
            status: 'healthy',
            service: 'A2A Gateway Proxy',
            timestamp: new Date().toISOString(),
        };
    }
    async proxyAll(path, headers, query, body) {
        const method = headers['x-http-method'] || headers['x-original-method'] || 'GET';
        const targetPath = `/api/a2a/${path}`;
        const response = await this.proxyService.proxyRequest('backend', targetPath, method, headers, body, query);
        return response.data;
    }
};
exports.A2AGatewayController = A2AGatewayController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], A2AGatewayController.prototype, "health", null);
__decorate([
    (0, common_1.All)(':path'),
    __param(0, (0, common_1.Param)('path')),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], A2AGatewayController.prototype, "proxyAll", null);
exports.A2AGatewayController = A2AGatewayController = __decorate([
    (0, common_1.Controller)('a2a'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], A2AGatewayController);
//# sourceMappingURL=a2a-gateway.controller.js.map