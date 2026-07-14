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
const agency_analytics_service_1 = require("../services/agency-analytics.service");
let AnalyticsController = class AnalyticsController {
    constructor(agencyAnalyticsService) {
        this.agencyAnalyticsService = agencyAnalyticsService;
    }
    async getAnalyticsOverview(agencyId, timeframe = '30d') {
        return this.agencyAnalyticsService.getOverview(agencyId, timeframe);
    }
    async getPerformanceMetrics(agencyId, timeframe = '7d', _granularity = 'hour') {
        return this.agencyAnalyticsService.getPerformance(agencyId, timeframe);
    }
    async getProviderPerformance(agencyId, timeframe = '30d', _categoryId) {
        return this.agencyAnalyticsService.getProviderPerformance(agencyId, timeframe);
    }
    async getQualityTrends(agencyId, timeframe = '90d', _breakdown = 'category') {
        return this.agencyAnalyticsService.getQualityTrends(agencyId, timeframe);
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
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('analytics'),
    (0, common_1.Controller)('analytics'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [agency_analytics_service_1.AgencyAnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map