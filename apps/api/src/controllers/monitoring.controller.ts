import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from '../services/monitoring.service.js';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get system metrics' })
  async getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health' })
  async getHealth() {
    return this.monitoringService.getHealth();
  }
}
