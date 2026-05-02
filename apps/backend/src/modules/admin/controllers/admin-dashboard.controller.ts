import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  drizzleAgentRepository,
  drizzleApiLogsRepository,
  drizzleUserRepository,
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
    const activeAgents = await drizzleAgentRepository.countActive();

    // 4. API Stats (24h)
    const statsArray = await drizzleApiLogsRepository.getStats(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const apiStats = statsArray[0] || { count: 0, errorCount: 0 };

    // 5. Intelligence Stats (from AI_Knowledge_Base.md)
    let intelligenceStats = { library: 0, artifacts: 0, density: '0%' };
    try {
      const fs = require('fs');
      const path = require('path');
      const kbPath = path.join(process.cwd(), '../my-ai-knowledge-base/AI_Knowledge_Base.md');
      const libPath = path.join(process.cwd(), '../my-ai-knowledge-base/video-library/ai_video_library.html');

      if (fs.existsSync(kbPath)) {
        const kbContent = fs.readFileSync(kbPath, 'utf8');
        const matches = kbContent.match(/## #(\d+):/g);
        intelligenceStats.artifacts = matches ? matches.length : 0;
      }

      if (fs.existsSync(libPath)) {
        const libContent = fs.readFileSync(libPath, 'utf8');
        const libMatches = libContent.match(/<td class="index-col">(\d+)<\/td>/g);
        if (libMatches) {
          const indices = libMatches.map(m => parseInt(m.match(/\d+/)[0]));
          intelligenceStats.library = Math.max(...indices);
        }
      }
      
      if (intelligenceStats.library > 0) {
        intelligenceStats.density = ((intelligenceStats.artifacts / intelligenceStats.library) * 100).toFixed(1) + '%';
      }
    } catch (e) {
      // Fallback if file system not accessible or files missing
    }

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
      intelligence: intelligenceStats,
    };
  }
}
