import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  agents,
  db,
  drizzleAgentRepository,
  drizzleApiLogsRepository,
  drizzleUserRepository,
  eq,
  sql,
} from '@the-new-fuse/database';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { SystemMetricsService } from '../../system-metrics/system-metrics.service';

@ApiTags('admin')
@Controller('admin/metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
export class AdminDashboardController {
  constructor(private readonly systemMetricsService: SystemMetricsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard metrics' })
  async getDashboardMetrics() {
    // 1. Fetch System Metrics (CPU, Memory, Health)
    const systemMetrics = await this.systemMetricsService.getHealthCheck();
    // Use the full metrics logic if possible, or just what getHealthCheck returns
    // getHealthCheck returns { status, timestamp, uptime }
    // We might want full metrics including memory/cpu.
    // systemMetricsService.getMetrics() is public.
    const fullSystemMetrics = await this.systemMetricsService.getMetrics();

    // 2. Fetch User Stats
    const totalUsers = await drizzleUserRepository.count();
    // Assuming we have an 'active' flag or just count all for now.
    // If no active flag, we'll just use total.
    const activeUsers = totalUsers; // Placeholder until we have activity tracking on users table

    // 3. Fetch Agent Stats
    const totalAgents = await drizzleAgentRepository.count();
    const activeAgentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(agents)
      .where(eq(agents.status, 'ACTIVE'));
    const activeAgents = Number(activeAgentsResult[0]?.count || 0);

    // 4. API Stats (24h)
    const statsArray = await drizzleApiLogsRepository.getStats(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const apiStats = statsArray[0] || { count: 0, errorCount: 0 };

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      agents: {
        total: totalAgents,
        active: activeAgents,
      },
      system: {
        health: fullSystemMetrics.status,
        uptime: fullSystemMetrics.uptime,
        cpu: fullSystemMetrics.cpu,
        memory: fullSystemMetrics.memory,
      },
      api: {
        requests: Number(apiStats.count),
        errors: Number(apiStats.errorCount),
      },
    };
  }
}
