import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  drizzleAgentRepository,
  drizzleAuditLogsRepository,
  drizzleUserRepository,
  drizzleWorkflowRepository,
} from '@the-new-fuse/database/drizzle/repositories';
import { CacheService } from '../cache/cache.service';
import { AdminGuard } from '../guards/admin.guard';
import { SecureAuthGuard } from '../guards/secure-auth.guard';
import { ChronologicalProcessesService } from '../modules/admin/chronological-processes.service';
import { UnifiedLedgerService } from '../modules/unified-ledger/unified-ledger.service';
import { MetricsService } from '../services/metrics.service';

type AdminRequest = {
  user?: {
    id?: string;
    userId?: string;
    roles?: string[];
    role?: string;
  };
};

/**
 * Admin Metrics Controller
 *
 * Provides comprehensive system metrics and monitoring data for admin dashboard.
 * All endpoints require SUPER_ADMIN or admin role access.
 */
@ApiTags('admin-metrics')
@Controller('admin/metrics')
@UseGuards(SecureAuthGuard, AdminGuard)
export class AdminMetricsController {
  private readonly userRepository = drizzleUserRepository;
  private readonly agentRepository = drizzleAgentRepository;
  private readonly workflowRepository = drizzleWorkflowRepository;
  private readonly auditLogsRepository = drizzleAuditLogsRepository;

  constructor(
    private readonly metricsService: MetricsService,
    private readonly unifiedLedgerService: UnifiedLedgerService,
    private readonly cacheService: CacheService,
    private readonly chronologicalProcessesService: ChronologicalProcessesService
  ) {}

  /**
   * Get comprehensive system metrics
   */
  @Get('system')
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async getSystemMetrics() {
    return this.metricsService.getSystemMetrics();
  }

  /**
   * Get dashboard overview metrics
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics' })
  async getDashboardMetrics() {
    // Calculate 24h ago for active user count
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalUsers, activeUsers, totalAgents, activeAgents, totalWorkflows, auditLogCount] =
      await Promise.all([
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
  @Get('api-analytics')
  @ApiOperation({ summary: 'Get API analytics' })
  @ApiResponse({ status: 200, description: 'API analytics data' })
  async getApiAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get audit logs for API calls within date range
    const logs = await this.auditLogsRepository.findAll({
      startDate: start,
      endDate: end,
    });

    // Aggregate by action
    const actionCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};

    logs.forEach((log: any) => {
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
  @Get('user-activity')
  @ApiOperation({ summary: 'Get user activity metrics' })
  @ApiResponse({ status: 200, description: 'User activity data' })
  async getUserActivity(@Query('days') days?: string) {
    const daysAgo = days ? parseInt(days, 10) : 30;
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const logs = await this.auditLogsRepository.findAll({
      startDate,
    });

    // Group by user
    const userActivity: Record<string, number> = {};

    logs.forEach((log: any) => {
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

  @Get('federation-gates')
  @ApiOperation({ summary: 'Get federation gate telemetry summary (handoff + broker)' })
  @ApiResponse({ status: 200, description: 'Federation gate telemetry snapshot' })
  async getFederationGateMetrics(
    @Query('hours') hoursRaw?: string,
    @Query('limit') limitRaw?: string
  ) {
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

    const byOutcome: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    const byReason: Record<string, number> = {};

    for (const row of gateRows) {
      const payload = (row.payload || {}) as Record<string, unknown>;
      const outcome = String(payload.outcome || 'unknown');
      const gateCategory = String(payload.gateCategory || 'unknown');
      const mode = String(payload.mode || 'unknown');
      const reason = String(payload.reason || 'unknown');

      byOutcome[outcome] = (byOutcome[outcome] || 0) + 1;
      byCategory[gateCategory] = (byCategory[gateCategory] || 0) + 1;
      byMode[mode] = (byMode[mode] || 0) + 1;
      byReason[reason] = (byReason[reason] || 0) + 1;
    }

    const brokerMetricsKey =
      process.env.BROKER_GATE_METRICS_HASH || 'tnf:broker:federation-gate:metrics';
    let brokerCountersRaw: Record<string, string> = {};
    let brokerAvailable = true;
    try {
      brokerCountersRaw = await this.cacheService.hgetall(brokerMetricsKey);
    } catch {
      brokerAvailable = false;
    }

    const brokerCounters: Record<string, number> = {};
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

  @Get('chronological-processes')
  @ApiOperation({
    summary: 'Get canonical + procedural chronological process registry and runtime state',
  })
  @ApiResponse({ status: 200, description: 'Chronological process control-plane snapshot' })
  async getChronologicalProcesses() {
    return this.chronologicalProcessesService.listProcesses();
  }

  @Put('chronological-processes/:processId')
  @ApiOperation({
    summary: 'Update chronological process controls (enabled/cadence/timezone/notes)',
  })
  @ApiResponse({ status: 200, description: 'Updated chronological process state' })
  async updateChronologicalProcess(
    @Param('processId') processId: string,
    @Body()
    body: {
      enabled?: boolean;
      cadence?: string;
      timezone?: string;
      notes?: string;
    },
    @Req() req: AdminRequest
  ) {
    const actorId = String(req?.user?.id || req?.user?.userId || 'admin');
    const actorRoles = Array.isArray(req?.user?.roles)
      ? req.user.roles
      : req?.user?.role
        ? [req.user.role]
        : [];

    return this.chronologicalProcessesService.updateProcess(
      processId,
      {
        enabled: body?.enabled,
        cadence: body?.cadence,
        timezone: body?.timezone,
        notes: body?.notes,
      },
      {
        actorId,
        actorRoles,
      }
    );
  }

  @Post('chronological-processes/:processId/run')
  @ApiOperation({ summary: 'Execute a chronological process immediately (run-now)' })
  @ApiResponse({ status: 200, description: 'Run-now execution summary + updated process state' })
  async runChronologicalProcess(@Param('processId') processId: string, @Req() req: AdminRequest) {
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

  @Get('chronological-processes/:processId/history')
  @ApiOperation({ summary: 'Get full execution history for a chronological process' })
  @ApiResponse({ status: 200, description: 'Chronological process execution history' })
  async getChronologicalProcessHistory(
    @Param('processId') processId: string,
    @Query('limit') limitRaw?: string
  ) {
    const limitParsed = Number.parseInt(String(limitRaw || ''), 10);
    const limit = Number.isFinite(limitParsed) ? limitParsed : undefined;
    return this.chronologicalProcessesService.getProcessHistory(processId, limit);
  }

  /**
   * Determine system health status based on metrics
   */
  private getHealthStatus(metrics: {
    memory?: { percentage?: number };
    cpu?: { usage?: number };
  }): 'healthy' | 'degraded' | 'critical' {
    const memUsage = metrics.memory?.percentage || 0;
    const cpuUsage = metrics.cpu?.usage || 0;

    if (memUsage > 90 || cpuUsage > 90) {
      return 'critical';
    } else if (memUsage > 75 || cpuUsage > 75) {
      return 'degraded';
    }

    return 'healthy';
  }
}
