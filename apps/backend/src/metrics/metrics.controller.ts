import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MetricsAggregatorService } from './metrics-aggregator.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('metrics')
@Controller()
@ApiBearerAuth()
export class MetricsController {
  constructor(private readonly metricsService: MetricsAggregatorService) {}

  @Get('dashboard/metrics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description: 'Retrieve aggregated metrics for the user dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
  })
  async getDashboardMetrics() {
    return this.metricsService.getDashboardMetrics();
  }

  @Get('admin/metrics/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin') // Allow super_admin too
  @ApiOperation({
    summary: 'Get admin dashboard metrics',
    description: 'Retrieve aggregated metrics for the admin dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin metrics retrieved successfully',
  })
  async getAdminDashboardMetrics() {
    return this.metricsService.getDashboardMetrics();
  }
}
