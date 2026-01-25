import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  drizzleAgentRepository,
  drizzleAuditLogsRepository,
  drizzleUserRepository,
  drizzleWorkflowRepository,
} from '@the-new-fuse/database/drizzle/repositories';
import { AdminGuard } from '../guards/admin.guard';
import { SecureAuthGuard } from '../guards/secure-auth.guard';
import { MetricsService } from '../services/metrics.service';

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
  constructor(
    private readonly metricsService: MetricsService,
    private readonly userRepository = drizzleUserRepository,
    private readonly agentRepository = drizzleAgentRepository,
    private readonly workflowRepository = drizzleWorkflowRepository,
    private readonly auditLogsRepository = drizzleAuditLogsRepository
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
    const [totalUsers, activeUsers, totalAgents, activeAgents, totalWorkflows, auditLogCount] =
      await Promise.all([
        this.userRepository.count(),
        this.getActiveUserCount(),
        this.agentRepository.count(),
        this.getActiveAgentCount(),
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

  /**
   * Get active user count (users with activity in last 24 hours)
   */
  private async getActiveUserCount(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await this.auditLogsRepository.findAll({
      startDate: oneDayAgo,
    });

    const uniqueUsers = new Set(recentLogs.map((log) => log.userId).filter(Boolean));
    return uniqueUsers.size;
  }

  /**
   * Get active agent count
   */
  private async getActiveAgentCount(): Promise<number> {
    const allAgents = await this.agentRepository.findAll();
    return allAgents.filter((agent: any) => agent.status === 'ACTIVE').length;
  }

  /**
   * Determine system health status based on metrics
   */
  private getHealthStatus(metrics: any): 'healthy' | 'degraded' | 'critical' {
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
