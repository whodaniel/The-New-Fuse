"use strict";
/**
 * Proxy Controller
 * Health checks and service discovery for the API Gateway
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proxy_service_1 = require("./proxy.service");
let ProxyController = class ProxyController {
    proxyService;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async getServicesHealth() {
        const servicesHealth = await this.proxyService.getAllServicesHealth();
        const allHealthy = Object.values(servicesHealth).every(Boolean);
        return {
            gateway: 'healthy',
            services: servicesHealth,
            overall: allHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
        };
    }
    async getServices() {
        const services = this.proxyService.getAllServices();
        return {
            count: services.length,
            services: services.map(service => ({
                name: service.name,
                baseUrl: service.baseUrl,
                healthPath: service.healthPath,
            })),
        };
    }
};
exports.ProxyController = ProxyController;
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Check health of all backend services' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Health status of all services' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "getServicesHealth", null);
__decorate([
    (0, common_1.Get)('services'),
    (0, swagger_1.ApiOperation)({ summary: 'Get registered services configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of registered services' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "getServices", null);
exports.ProxyController = ProxyController = __decorate([
    (0, common_1.Controller)('proxy'),
    (0, swagger_1.ApiTags)('health'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], ProxyController);
//# sourceMappingURL=proxy.controller.js.map