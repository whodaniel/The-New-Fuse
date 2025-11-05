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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const healthService_1 = require("../services/healthService");
const authGuard_1 = require("../guards/authGuard");
let HealthController = class HealthController {
    healthService;
    constructor(healthService) {
        this.healthService = healthService;
    }
    async getBasicHealth() {
        const health = await this.healthService.getHealthStatus();
        return {
            status: health.status,
            timestamp: health.timestamp
        };
    }
    async getDetailedHealth() {
        return this.healthService.getHealthStatus();
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get basic health status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is healthy' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Service is unhealthy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getBasicHealth", null);
__decorate([
    (0, common_1.Get)('/detailed'),
    (0, common_1.UseGuards)(authGuard_1.AuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed health status' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Detailed health information',
        type: 'object',
        schema: {
            properties: {
                status: {
                    type: 'string',
                    enum: ['healthy', 'degraded', 'unhealthy']
                },
                timestamp: {
                    type: 'string',
                    format: 'date-time'
                },
                components: {
                    type: 'object',
                    properties: {
                        database: {
                            type: 'object',
                            properties: {
                                status: { type: 'string' },
                                latency: { type: 'number' },
                                error: { type: 'string' }
                            }
                        },
                        redis: {
                            type: 'object',
                            properties: {
                                status: { type: 'string' },
                                latency: { type: 'number' },
                                error: { type: 'string' }
                            }
                        },
                        cache: {
                            type: 'object',
                            properties: {
                                status: { type: 'string' },
                                stats: {
                                    type: 'object',
                                    properties: {
                                        hits: { type: 'number' },
                                        misses: { type: 'number' },
                                        keys: { type: 'number' },
                                        memoryUsed: { type: 'number' }
                                    }
                                },
                                error: { type: 'string' }
                            }
                        },
                        system: {
                            type: 'object',
                            properties: {
                                status: { type: 'string' },
                                uptime: { type: 'number' },
                                memory: {
                                    type: 'object',
                                    properties: {
                                        used: { type: 'number' },
                                        total: { type: 'number' },
                                        percentage: { type: 'number' }
                                    }
                                },
                                cpu: {
                                    type: 'object',
                                    properties: {
                                        usage: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'Service is unhealthy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getDetailedHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [healthService_1.HealthService])
], HealthController);
//# sourceMappingURL=healthController.js.map