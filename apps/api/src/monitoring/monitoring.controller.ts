import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WalletMonitoringService } from './wallet-monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: WalletMonitoringService) {}

  @Get('health')
  async getSystemHealth() {
    return await this.monitoringService.getSystemMetrics();
  }

  @Get('alerts')
  getRecentAlerts() {
    return this.monitoringService.getRecentAlerts();
  }

  @Post('alert')
  async createAlert(@Body() alertData: {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    metadata?: any;
  }) {
    await this.monitoringService.createAlert(alertData as any);
    return { success: true };
  }
}