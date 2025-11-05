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
import { Controller, Get, Param, Query, UseGuards, HttpStatus, HttpException, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnhancedAgencyService } from '@the-new-fuse/core/services/enhanced-agency.service';
import { AgentSwarmOrchestrationService } from '@the-new-fuse/core/services/agent-swarm-orchestration.service';
import { ServiceCategoryRouterService } from '@the-new-fuse/core/services/service-category-router.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { EnhancedUserRole } from '@prisma/client';
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
            throw new HttpException(error.message || 'Failed to get analytics overview', HttpStatus.NOT_FOUND);
        }
    }
    async getPerformanceMetrics(agencyId, timeframe = '7d', granularity = 'hour') {
        try {
            return await this.swarmOrchestrationService.getDetailedMetrics(agencyId, timeframe, granularity);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get performance metrics', HttpStatus.NOT_FOUND);
        }
    }
    async getProviderPerformance(agencyId, timeframe = '30d', categoryId) {
        try {
            return await this.serviceCategoryRouter.getProviderPerformance(agencyId, timeframe, categoryId);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get provider performance', HttpStatus.NOT_FOUND);
        }
    }
    async getQualityTrends(agencyId, timeframe = '90d', breakdown = 'category') {
        try {
            return await this.enhancedAgencyService.getQualityTrends(agencyId, timeframe, breakdown);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get quality trends', HttpStatus.NOT_FOUND);
        }
    }
    async getUtilizationMetrics(agencyId, timeframe = '24h') {
        try {
            return await this.swarmOrchestrationService.getUtilizationMetrics(agencyId, timeframe);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get utilization metrics', HttpStatus.NOT_FOUND);
        }
    }
    async getCostAnalysis(agencyId, timeframe = '30d', breakdown = 'category') {
        try {
            return await this.enhancedAgencyService.getCostAnalysis(agencyId, timeframe, breakdown);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get cost analysis', HttpStatus.NOT_FOUND);
        }
    }
    async getBottleneckAnalysis(agencyId, timeframe = '7d') {
        try {
            return await this.swarmOrchestrationService.identifyBottlenecks(agencyId, timeframe);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get bottleneck analysis', HttpStatus.NOT_FOUND);
        }
    }
    async getPredictiveAnalytics(agencyId, horizon = '30d') {
        try {
            return await this.enhancedAgencyService.getPredictiveAnalytics(agencyId, horizon);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get predictive analytics', HttpStatus.NOT_FOUND);
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
            throw new HttpException(error.message || 'Failed to export analytics data', HttpStatus.NOT_FOUND);
        }
    }
};
__decorate([
    Get(':agencyId/overview'),
    ApiOperation({ summary: 'Get comprehensive agency analytics overview' }),
    ApiResponse({ status: 200, description: 'Analytics overview retrieved' }),
    __param(0, Param('agencyId')),
    __param(1, Query('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAnalyticsOverview", null);
__decorate([
    Get(':agencyId/performance'),
    ApiOperation({ summary: 'Get detailed performance metrics' }),
    ApiResponse({ status: 200, description: 'Performance metrics retrieved' }),
    __param(0, Param('agencyId')),
    __param(1, Query('timeframe')),
    __param(2, Query('granularity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPerformanceMetrics", null);
__decorate([
    Get(':agencyId/providers/performance'),
    ApiOperation({ summary: 'Get provider performance analytics' }),
    ApiResponse({ status: 200, description: 'Provider performance retrieved' }),
    __param(0, Param('agencyId')),
    __param(1, Query('timeframe')),
    __param(2, Query('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getProviderPerformance", null);
__decorate([
    Get(':agencyId/quality-trends'),
    ApiOperation({ summary: 'Get quality trend analysis' }),
    ApiResponse({ status: 200, description: 'Quality trends retrieved' }),
    __param(0, Param('agencyId')),
    __param(1, Query('timeframe')),
    __param(2, Query('breakdown')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getQualityTrends", null);
__decorate([
    Get(':agencyId/utilization'),
    ApiOperation({ summary: 'Get resource utilization metrics' }),
    ApiResponse({ status: 200, description: 'Utilization metrics retrieved' }),
    __param(0, Param('agencyId')),
    __param(1, Query('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUtilizationMetrics", null);
__decorate([
    Get(':agencyId/cost-analysis'),
    ApiOperation({ summary: 'Get cost analysis and billing insights' }),
    ApiResponse({ status: 200, description: 'Cost analysis retrieved' }),
    __param(0, Param('agencyId')),
    __param(1, Query('timeframe')),
    __param(2, Query('breakdown')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCostAnalysis", null);
__decorate([
    Get(':agencyId/bottlenecks'),
    ApiOperation({ summary: 'Identify performance bottlenecks' }),
    ApiResponse({ status: 200, description: 'Bottleneck analysis retrieved' }),
    __param(0, Param('agencyId')),
    __param(1, Query('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getBottleneckAnalysis", null);
__decorate([
    Get(':agencyId/predictions'),
    ApiOperation({ summary: 'Get predictive analytics and recommendations' }),
    ApiResponse({ status: 200, description: 'Predictions retrieved' }),
    __param(0, Param('agencyId')),
    __param(1, Query('horizon')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPredictiveAnalytics", null);
__decorate([
    Get(':agencyId/export'),
    ApiOperation({ summary: 'Export analytics data' }),
    ApiResponse({ status: 200, description: 'Analytics data exported' }),
    __param(0, Param('agencyId')),
    __param(1, Query('timeframe')),
    __param(2, Query('format')),
    __param(3, Query('include')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "exportAnalyticsData", null);
AnalyticsController = __decorate([
    ApiTags('analytics'),
    Controller('api/analytics'),
    UseGuards(AuthGuard, RolesGuard),
    Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN),
    ApiBearerAuth(),
    __metadata("design:paramtypes", [typeof (_a = typeof EnhancedAgencyService !== "undefined" && EnhancedAgencyService) === "function" ? _a : Object, typeof (_b = typeof AgentSwarmOrchestrationService !== "undefined" && AgentSwarmOrchestrationService) === "function" ? _b : Object, typeof (_c = typeof ServiceCategoryRouterService !== "undefined" && ServiceCategoryRouterService) === "function" ? _c : Object])
], AnalyticsController);
export { AnalyticsController };
//# sourceMappingURL=analytics.controller.js.map