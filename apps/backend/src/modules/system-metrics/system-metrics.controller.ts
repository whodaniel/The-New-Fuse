import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemMetricsService } from './system-metrics.service.js';
import { SystemMetricsResponseDto } from './dto/system-metrics.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

@ApiTags('system')
@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SystemMetricsController {
  constructor(private readonly systemMetricsService: SystemMetricsService) {}

  @Get('metrics')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get system metrics',
    description: 'Retrieve comprehensive system health and performance metrics (Admin only)'
  })
  @ApiResponse({
    status: 200,
    description: 'System metrics retrieved successfully',
    type: SystemMetricsResponseDto
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getMetrics(): Promise<SystemMetricsResponseDto> {
    return this.systemMetricsService.getMetrics();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Quick health check for system status monitoring'
  })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 86400 }
      }
    }
  })
  async getHealth() {
    return this.systemMetricsService.getHealthCheck();
  }
}
