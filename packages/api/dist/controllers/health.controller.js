/**
 * Health Check Controller
 * Provides health check endpoints for the application
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
import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from '../services/health.service.js';
let HealthController = class HealthController {
    constructor(healthService) {
        this.healthService = healthService;
    }
    /**
     * Basic health check endpoint using Terminus
     * @returns Health check status
     */
    async check() {
        return this.healthService.isHealthy('database');
    }
};
__decorate([
    Get(),
    HealthCheck(),
    ApiOperation({ summary: 'Check API health' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
HealthController = __decorate([
    ApiTags('health'),
    Controller('health'),
    __metadata("design:paramtypes", [HealthService])
], HealthController);
export { HealthController };
//# sourceMappingURL=health.controller.js.map