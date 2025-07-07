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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const enhanced_agency_service_1 = require("@the-new-fuse/core/services/enhanced-agency.service");
const agent_swarm_orchestration_service_1 = require("@the-new-fuse/core/services/agent-swarm-orchestration.service");
const service_category_router_service_1 = require("@the-new-fuse/core/services/service-category-router.service");
const auth_guard_1 = require("../../../guards/auth.guard");
const roles_guard_1 = require("../../../guards/roles.guard");
const roles_decorator_1 = require("../../../decorators/roles.decorator");
const client_1 = require("@prisma/client");
let AnalyticsController = class AnalyticsController {
    enhancedAgencyService;
    swarmOrchestrationService;
    serviceCategoryRouter;
    constructor(enhancedAgencyService, swarmOrchestrationService, serviceCategoryRouter) {
        this.enhancedAgencyService = enhancedAgencyService;
        this.swarmOrchestrationService = swarmOrchestrationService;
        this.serviceCategoryRouter = serviceCategoryRouter;
    }
    async getAnalyticsOverview(agencyId, timeframe = '30d') {
        try {
            const [agencyAnalytics, swarmMetrics, serviceMetrics] = await Promise.all([
                this.enhancedAgencyService.getAnalytics(agencyId, timeframe),
                this.swarmOrchestrationService.getPerformanceMetrics(agencyId, timeframe),
                this.serviceCategoryRouter.getCategoryPerformance(agencyId, timeframe)
            ]);
            return {
                timeframe,
                generatedAt: new Date().toISOString(),
                agency: agencyAnalytics,
                swarm: swarmMetrics,
                services: serviceMetrics,
                summary: {
                    totalExecutions: swarmMetrics.totalExecutions || 0,
                    totalRequests: serviceMetrics.totalRequests || 0,
                    averageQuality: serviceMetrics.averageQuality || 0,
                    providerUtilization: serviceMetrics.providerUtilization || 0,
                    clientSatisfaction: serviceMetrics.clientSatisfaction || 0
                }
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get analytics overview', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getPerformanceMetrics(agencyId, timeframe = '7d', granularity = 'hour') {
        try {
            return await this.swarmOrchestrationService.getDetailedMetrics(agencyId, timeframe, granularity);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get performance metrics', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getProviderPerformance(agencyId, timeframe = '30d', categoryId) {
        try {
            return await this.serviceCategoryRouter.getProviderPerformance(agencyId, timeframe, categoryId);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get provider performance', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getQualityTrends(agencyId, timeframe = '90d', breakdown = 'category') {
        try {
            return await this.enhancedAgencyService.getQualityTrends(agencyId, timeframe, breakdown);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get quality trends', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getUtilizationMetrics(agencyId, timeframe = '24h') {
        try {
            return await this.swarmOrchestrationService.getUtilizationMetrics(agencyId, timeframe);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get utilization metrics', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getCostAnalysis(agencyId, timeframe = '30d', breakdown = 'category') {
        try {
            return await this.enhancedAgencyService.getCostAnalysis(agencyId, timeframe, breakdown);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get cost analysis', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getBottleneckAnalysis(agencyId, timeframe = '7d') {
        try {
            return await this.swarmOrchestrationService.identifyBottlenecks(agencyId, timeframe);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get bottleneck analysis', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getPredictiveAnalytics(agencyId, horizon = '30d') {
        try {
            return await this.enhancedAgencyService.getPredictiveAnalytics(agencyId, horizon);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to get predictive analytics', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async exportAnalyticsData(agencyId, timeframe = '30d', format = 'json', include // comma-separated list
    ) {
        try {
            const includeMetrics = include ? include.split(',') : [
                'executions',
                'requests',
                'providers',
                'quality',
                'costs'
            ];
            return await this.enhancedAgencyService.exportAnalyticsData(agencyId, timeframe, format, includeMetrics);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to export analytics data', common_1.HttpStatus.NOT_FOUND);
        }
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)(':agencyId/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get comprehensive agency analytics overview' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics overview retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAnalyticsOverview", null);
__decorate([
    (0, common_1.Get)(':agencyId/performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed performance metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Performance metrics retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Query)('granularity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPerformanceMetrics", null);
__decorate([
    (0, common_1.Get)(':agencyId/providers/performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get provider performance analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider performance retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Query)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getProviderPerformance", null);
__decorate([
    (0, common_1.Get)(':agencyId/quality-trends'),
    (0, swagger_1.ApiOperation)({ summary: 'Get quality trend analysis' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Quality trends retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Query)('breakdown')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getQualityTrends", null);
__decorate([
    (0, common_1.Get)(':agencyId/utilization'),
    (0, swagger_1.ApiOperation)({ summary: 'Get resource utilization metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Utilization metrics retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUtilizationMetrics", null);
__decorate([
    (0, common_1.Get)(':agencyId/cost-analysis'),
    (0, swagger_1.ApiOperation)({ summary: 'Get cost analysis and billing insights' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cost analysis retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Query)('breakdown')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCostAnalysis", null);
__decorate([
    (0, common_1.Get)(':agencyId/bottlenecks'),
    (0, swagger_1.ApiOperation)({ summary: 'Identify performance bottlenecks' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bottleneck analysis retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getBottleneckAnalysis", null);
__decorate([
    (0, common_1.Get)(':agencyId/predictions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get predictive analytics and recommendations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Predictions retrieved' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('horizon')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPredictiveAnalytics", null);
__decorate([
    (0, common_1.Get)(':agencyId/export'),
    (0, swagger_1.ApiOperation)({ summary: 'Export analytics data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics data exported' }),
    __param(0, (0, common_1.Param)('agencyId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Query)('include')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "exportAnalyticsData", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('analytics'),
    (0, common_1.Controller)('api/analytics'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.AGENCY_OWNER, client_1.UserRole.AGENCY_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [typeof (_a = typeof enhanced_agency_service_1.EnhancedAgencyService !== "undefined" && enhanced_agency_service_1.EnhancedAgencyService) === "function" ? _a : Object, typeof (_b = typeof agent_swarm_orchestration_service_1.AgentSwarmOrchestrationService !== "undefined" && agent_swarm_orchestration_service_1.AgentSwarmOrchestrationService) === "function" ? _b : Object, typeof (_c = typeof service_category_router_service_1.ServiceCategoryRouterService !== "undefined" && service_category_router_service_1.ServiceCategoryRouterService) === "function" ? _c : Object])
], AnalyticsController);
