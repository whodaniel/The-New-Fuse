import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from '../services/monitoring.service.js';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('memory')
  @ApiOperation({ summary: 'Get memory items and stats' })
  async getMemory() {
    return this.monitoringService.getMemoryItems();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get custom metrics: step and memory' })
  async getCustomMetrics() {
    return this.monitoringService.getCustomMetrics();
  }
}