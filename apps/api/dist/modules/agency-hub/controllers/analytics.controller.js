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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
// import { EnhancedAgencyService } from '../../../types/core/services/enhanced-agency.service';
// import { AgentSwarmOrchestrationService } from '../../../types/core/services/agent-swarm-orchestration.service';
// import { ServiceCategoryRouterService } from '../../../types/core/services/service-category-router.service';
// import { AuthGuard } from '../../../guards/auth.guard';
// import { RolesGuard } from '../../../guards/roles.guard';
// import { Roles } from '../../../decorators/roles.decorator';
let AnalyticsController = class AnalyticsController {
    // constructor(
    //   private readonly enhancedAgencyService: EnhancedAgencyService,
    //   private readonly swarmOrchestrationService: AgentSwarmOrchestrationService,
    //   private readonly serviceCategoryRouter: ServiceCategoryRouterService
    // ) {}
    async getAnalyticsOverview(agencyId, timeframe = '30d') {
        this.notImplemented('Agency analytics overview');
    }
    async getPerformanceMetrics(agencyId, timeframe = '7d', granularity = 'hour') {
        this.notImplemented('Agency performance metrics');
    }
    async getProviderPerformance(agencyId, timeframe = '30d', categoryId) {
        this.notImplemented('Provider performance analytics');
    }
    async getQualityTrends(agencyId, timeframe = '90d', breakdown = 'category') {
        this.notImplemented('Quality trend analytics');
    }
    async getUtilizationMetrics(agencyId, timeframe = '24h') {
        this.notImplemented('Resource utilization analytics');
    }
    async getCostAnalysis(agencyId, timeframe = '30d', breakdown = 'category') {
        this.notImplemented('Cost analysis');
    }
    async getBottleneckAnalysis(agencyId, timeframe = '7d') {
        this.notImplemented('Bottleneck analysis');
    }
    async getPredictiveAnalytics(agencyId, horizon = '30d') {
        this.notImplemented('Predictive analytics');
    }
    async exportAnalyticsData(agencyId, timeframe = '30d', format = 'json', include // comma-separated list
    ) {
        this.notImplemented('Analytics export');
    }
    notImplemented(feature) {
        throw new common_1.HttpException(`${feature} is not implemented in this deployment.`, common_1.HttpStatus.NOT_IMPLEMENTED);
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
    (0, common_1.Controller)('analytics')
    // @UseGuards(AuthGuard, RolesGuard)
    // @Roles(UserRole.AGENCY_OWNER, UserRole.AGENCY_ADMIN)
    ,
    (0, swagger_1.ApiBearerAuth)()
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map