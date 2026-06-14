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
exports.AdminMetricsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const repositories_1 = require("@the-new-fuse/database/drizzle/repositories");
const cache_service_1 = require("../cache/cache.service");
const admin_guard_1 = require("../guards/admin.guard");
const secure_auth_guard_1 = require("../guards/secure-auth.guard");
const chronological_processes_service_1 = require("../modules/admin/chronological-processes.service");
const unified_ledger_service_1 = require("../modules/unified-ledger/unified-ledger.service");
const metrics_service_1 = require("../services/metrics.service");
/**
 * Admin Metrics Controller
 *
 * Provides comprehensive system metrics and monitoring data for admin dashboard.
 * All endpoints require SUPER_ADMIN or admin role access.
 */
let AdminMetricsController = class AdminMetricsController {
    constructor(metricsService, unifiedLedgerService, cacheService, chronologicalProcessesService) {
        this.metricsService = metricsService;
        this.unifiedLedgerService = unifiedLedgerService;
        this.cacheService = cacheService;
        this.chronologicalProcessesService = chronologicalProcessesService;
        this.userRepository = repositories_1.drizzleUserRepository;
        this.agentRepository = repositories_1.drizzleAgentRepository;
        this.workflowRepository = repositories_1.drizzleWorkflowRepository;
        this.auditLogsRepository = repositories_1.drizzleAuditLogsRepository;
    }
    /**
     * Get comprehensive system metrics
     */
    async getSystemMetrics() {
        return this.metricsService.getSystemMetrics();
    }
    /**
     * Get dashboard overview metrics
     */
    async getDashboardMetrics() {
        // Calculate 24h ago for active user count
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [totalUsers, activeUsers, totalAgents, activeAgents, totalWorkflows, auditLogCount] = await Promise.all([
            this.userRepository.count(),
            this.auditLogsRepository.countActiveUsers(oneDayAgo),
            this.agentRepository.count(),
            this.agentRepository.countActive(),
            this.workflowRepository.count(),
            this.auditLogsRepository.count(),
        ]);
        const systemMetrics = await this.metricsService.getSystemStats();
        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                inactive: totalUsers - activeUsers,
            },
            agents: {
                total: totalAgents,
                active: activeAgents,
                inactive: totalAgents - activeAgents,
            },
            workflows: {
                total: totalWorkflows,
            },
            system: {
                ...systemMetrics,
                health: this.getHealthStatus(systemMetrics),
            },
            auditLogs: {
                total: auditLogCount,
            },
            timestamp: new Date(),
        };
    }
    /**
     * Get API analytics
     */
    async getApiAnalytics(startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        // Get audit logs for API calls within date range
        const logs = await this.auditLogsRepository.findAll({
            startDate: start,
            endDate: end,
        });
        // Aggregate by action
        const actionCounts = {};
        const statusCounts = {};
        logs.forEach((log) => {
            if (log.action) {
                actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
            }
            if (log.status) {
                statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;
            }
        });
        return {
            period: { start, end },
            totalRequests: logs.length,
            byAction: actionCounts,
            byStatus: statusCounts,
            successRate: logs.length > 0 ? ((statusCounts['success'] || 0) / logs.length) * 100 : 100,
        };
    }
    /**
     * Get user activity metrics
     */
    async getUserActivity(days) {
        const daysAgo = days ? parseInt(days, 10) : 30;
        const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const logs = await this.auditLogsRepository.findAll({
            startDate,
        });
        // Group by user
        const userActivity = {};
        logs.forEach((log) => {
            if (log.userId) {
                userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
            }
        });
        return {
            period: { days: daysAgo, startDate },
            totalActions: logs.length,
            activeUsers: Object.keys(userActivity).length,
            activityByUser: userActivity,
        };
    }
    async getFederationGateMetrics(hoursRaw, limitRaw) {
        const now = new Date();
        const hoursValue = Number.parseInt(hoursRaw || '24', 10);
        const limitValue = Number.parseInt(limitRaw || '200', 10);
        const hours = Number.isFinite(hoursValue) ? Math.max(1, Math.min(168, hoursValue)) : 24;
        const limit = Number.isFinite(limitValue) ? Math.max(10, Math.min(1000, limitValue)) : 200;
        const dateFrom = new Date(now.getTime() - hours * 60 * 60 * 1000);
        const timelineRows = await this.unifiedLedgerService.listTimelineEvents({
            eventType: 'historical_event',
            actor: 'agent_handoff_service',
            dateFrom: dateFrom.toISOString(),
            dateTo: now.toISOString(),
        });
        const gateRows = timelineRows
            .filter((event) => event?.payload?.category === 'handoff_gate_evaluation')
            .slice(0, limit);
        const byOutcome = {};
        const byCategory = {};
        const byMode = {};
        const byReason = {};
        for (const row of gateRows) {
            const payload = (row.payload || {});
            const outcome = String(payload.outcome || 'unknown');
            const gateCategory = String(payload.gateCategory || 'unknown');
            const mode = String(payload.mode || 'unknown');
            const reason = String(payload.reason || 'unknown');
            byOutcome[outcome] = (byOutcome[outcome] || 0) + 1;
            byCategory[gateCategory] = (byCategory[gateCategory] || 0) + 1;
            byMode[mode] = (byMode[mode] || 0) + 1;
            byReason[reason] = (byReason[reason] || 0) + 1;
        }
        const brokerMetricsKey = process.env.BROKER_GATE_METRICS_HASH || 'tnf:broker:federation-gate:metrics';
        let brokerCountersRaw = {};
        let brokerAvailable = true;
        try {
            brokerCountersRaw = await this.cacheService.hgetall(brokerMetricsKey);
        }
        catch {
            brokerAvailable = false;
        }
        const brokerCounters = {};
        for (const [key, value] of Object.entries(brokerCountersRaw || {})) {
            const parsed = Number.parseInt(String(value), 10);
            brokerCounters[key] = Number.isFinite(parsed) ? parsed : 0;
        }
        const recent = gateRows.slice(0, 50).map((event) => ({
            id: event.id,
            timestamp: event.timestamp,
            actor: event.actor,
            payload: event.payload,
        }));
        return {
            window: {
                hours,
                dateFrom: dateFrom.toISOString(),
                dateTo: now.toISOString(),
                limit,
            },
            apiHandoff: {
                total: gateRows.length,
                byOutcome,
                byCategory,
                byMode,
                topReasons: Object.entries(byReason)
                    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
                    .slice(0, 10)
                    .map(([reason, count]) => ({ reason, count })),
                recent,
            },
            broker: {
                available: brokerAvailable,
                metricsKey: brokerMetricsKey,
                counters: brokerCounters,
            },
            timestamp: now.toISOString(),
        };
    }
    async getChronologicalProcesses() {
        return this.chronologicalProcessesService.listProcesses();
    }
    async updateChronologicalProcess(processId, body, req) {
        const actorId = String(req?.user?.id || req?.user?.userId || 'admin');
        const actorRoles = Array.isArray(req?.user?.roles)
            ? req.user.roles
            : req?.user?.role
                ? [req.user.role]
                : [];
        return this.chronologicalProcessesService.updateProcess(processId, {
            enabled: body?.enabled,
            cadence: body?.cadence,
            timezone: body?.timezone,
            notes: body?.notes,
        }, {
            actorId,
            actorRoles,
        });
    }
    async runChronologicalProcess(processId, req) {
        const actorId = String(req?.user?.id || req?.user?.userId || 'admin');
        const actorRoles = Array.isArray(req?.user?.roles)
            ? req.user.roles
            : req?.user?.role
                ? [req.user.role]
                : [];
        return this.chronologicalProcessesService.runProcessNow(processId, {
            actorId,
            actorRoles,
        });
    }
    async getChronologicalProcessHistory(processId, limitRaw) {
        const limitParsed = Number.parseInt(String(limitRaw || ''), 10);
        const limit = Number.isFinite(limitParsed) ? limitParsed : undefined;
        return this.chronologicalProcessesService.getProcessHistory(processId, limit);
    }
    /**
     * Determine system health status based on metrics
     */
    getHealthStatus(metrics) {
        const memUsage = metrics.memory?.percentage || 0;
        const cpuUsage = metrics.cpu?.usage || 0;
        if (memUsage > 90 || cpuUsage > 90) {
            return 'critical';
        }
        else if (memUsage > 75 || cpuUsage > 75) {
            return 'degraded';
        }
        return 'healthy';
    }
};
exports.AdminMetricsController = AdminMetricsController;
__decorate([
    (0, common_1.Get)('system'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System metrics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "getSystemMetrics", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard metrics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "getDashboardMetrics", null);
__decorate([
    (0, common_1.Get)('api-analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get API analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'API analytics data' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "getApiAnalytics", null);
__decorate([
    (0, common_1.Get)('user-activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user activity metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User activity data' }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "getUserActivity", null);
__decorate([
    (0, common_1.Get)('federation-gates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get federation gate telemetry summary (handoff + broker)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Federation gate telemetry snapshot' }),
    __param(0, (0, common_1.Query)('hours')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "getFederationGateMetrics", null);
__decorate([
    (0, common_1.Get)('chronological-processes'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get canonical + procedural chronological process registry and runtime state',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chronological process control-plane snapshot' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "getChronologicalProcesses", null);
__decorate([
    (0, common_1.Put)('chronological-processes/:processId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update chronological process controls (enabled/cadence/timezone/notes)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated chronological process state' }),
    __param(0, (0, common_1.Param)('processId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "updateChronologicalProcess", null);
__decorate([
    (0, common_1.Post)('chronological-processes/:processId/run'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute a chronological process immediately (run-now)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Run-now execution summary + updated process state' }),
    __param(0, (0, common_1.Param)('processId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "runChronologicalProcess", null);
__decorate([
    (0, common_1.Get)('chronological-processes/:processId/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full execution history for a chronological process' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chronological process execution history' }),
    __param(0, (0, common_1.Param)('processId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminMetricsController.prototype, "getChronologicalProcessHistory", null);
exports.AdminMetricsController = AdminMetricsController = __decorate([
    (0, swagger_1.ApiTags)('admin-metrics'),
    (0, common_1.Controller)('admin/metrics'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService,
        unified_ledger_service_1.UnifiedLedgerService,
        cache_service_1.CacheService,
        chronological_processes_service_1.ChronologicalProcessesService])
], AdminMetricsController);
//# sourceMappingURL=admin-metrics.controller.js.map