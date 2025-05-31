var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Controller, Get, UseGuards, HttpStatus, HttpException, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../guards/auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { EnhancedUserRole } from '@prisma/client';
let AnalyticsController = (() => {
    let _classDecorators = [ApiTags('analytics'), Controller('api/analytics'), UseGuards(AuthGuard, RolesGuard), Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN), ApiBearerAuth()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getAnalyticsOverview_decorators;
    let _getPerformanceMetrics_decorators;
    let _getProviderPerformance_decorators;
    let _getQualityTrends_decorators;
    let _getUtilizationMetrics_decorators;
    let _getCostAnalysis_decorators;
    let _getBottleneckAnalysis_decorators;
    let _getPredictiveAnalytics_decorators;
    let _exportAnalyticsData_decorators;
    var AnalyticsController = _classThis = class {
        constructor(enhancedAgencyService, swarmOrchestrationService, serviceCategoryRouter) {
            this.enhancedAgencyService = (__runInitializers(this, _instanceExtraInitializers), enhancedAgencyService);
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
    __setFunctionName(_classThis, "AnalyticsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getAnalyticsOverview_decorators = [Get(':agencyId/overview'), ApiOperation({ summary: 'Get comprehensive agency analytics overview' }), ApiResponse({ status: 200, description: 'Analytics overview retrieved' })];
        _getPerformanceMetrics_decorators = [Get(':agencyId/performance'), ApiOperation({ summary: 'Get detailed performance metrics' }), ApiResponse({ status: 200, description: 'Performance metrics retrieved' })];
        _getProviderPerformance_decorators = [Get(':agencyId/providers/performance'), ApiOperation({ summary: 'Get provider performance analytics' }), ApiResponse({ status: 200, description: 'Provider performance retrieved' })];
        _getQualityTrends_decorators = [Get(':agencyId/quality-trends'), ApiOperation({ summary: 'Get quality trend analysis' }), ApiResponse({ status: 200, description: 'Quality trends retrieved' })];
        _getUtilizationMetrics_decorators = [Get(':agencyId/utilization'), ApiOperation({ summary: 'Get resource utilization metrics' }), ApiResponse({ status: 200, description: 'Utilization metrics retrieved' })];
        _getCostAnalysis_decorators = [Get(':agencyId/cost-analysis'), ApiOperation({ summary: 'Get cost analysis and billing insights' }), ApiResponse({ status: 200, description: 'Cost analysis retrieved' })];
        _getBottleneckAnalysis_decorators = [Get(':agencyId/bottlenecks'), ApiOperation({ summary: 'Identify performance bottlenecks' }), ApiResponse({ status: 200, description: 'Bottleneck analysis retrieved' })];
        _getPredictiveAnalytics_decorators = [Get(':agencyId/predictions'), ApiOperation({ summary: 'Get predictive analytics and recommendations' }), ApiResponse({ status: 200, description: 'Predictions retrieved' })];
        _exportAnalyticsData_decorators = [Get(':agencyId/export'), ApiOperation({ summary: 'Export analytics data' }), ApiResponse({ status: 200, description: 'Analytics data exported' })];
        __esDecorate(_classThis, null, _getAnalyticsOverview_decorators, { kind: "method", name: "getAnalyticsOverview", static: false, private: false, access: { has: obj => "getAnalyticsOverview" in obj, get: obj => obj.getAnalyticsOverview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPerformanceMetrics_decorators, { kind: "method", name: "getPerformanceMetrics", static: false, private: false, access: { has: obj => "getPerformanceMetrics" in obj, get: obj => obj.getPerformanceMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProviderPerformance_decorators, { kind: "method", name: "getProviderPerformance", static: false, private: false, access: { has: obj => "getProviderPerformance" in obj, get: obj => obj.getProviderPerformance }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getQualityTrends_decorators, { kind: "method", name: "getQualityTrends", static: false, private: false, access: { has: obj => "getQualityTrends" in obj, get: obj => obj.getQualityTrends }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUtilizationMetrics_decorators, { kind: "method", name: "getUtilizationMetrics", static: false, private: false, access: { has: obj => "getUtilizationMetrics" in obj, get: obj => obj.getUtilizationMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCostAnalysis_decorators, { kind: "method", name: "getCostAnalysis", static: false, private: false, access: { has: obj => "getCostAnalysis" in obj, get: obj => obj.getCostAnalysis }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBottleneckAnalysis_decorators, { kind: "method", name: "getBottleneckAnalysis", static: false, private: false, access: { has: obj => "getBottleneckAnalysis" in obj, get: obj => obj.getBottleneckAnalysis }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPredictiveAnalytics_decorators, { kind: "method", name: "getPredictiveAnalytics", static: false, private: false, access: { has: obj => "getPredictiveAnalytics" in obj, get: obj => obj.getPredictiveAnalytics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportAnalyticsData_decorators, { kind: "method", name: "exportAnalyticsData", static: false, private: false, access: { has: obj => "exportAnalyticsData" in obj, get: obj => obj.exportAnalyticsData }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnalyticsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnalyticsController = _classThis;
})();
export { AnalyticsController };
