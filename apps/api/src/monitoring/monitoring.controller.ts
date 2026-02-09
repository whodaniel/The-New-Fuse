import { Controller, Get, Post, Body } from '@nestjs/common';
import { WalletMonitoringService, SystemHealth, SecurityAlert } from './wallet-monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: WalletMonitoringService) {}

  @Get('health')
  async getSystemHealth(): Promise<{
    health: SystemHealth;
    recentAlerts: SecurityAlert[];
    alertStats: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  }> {
    return await this.monitoringService.getSystemMetrics();
  }

  @Get('alerts')
  getRecentAlerts(): SecurityAlert[] {
    return this.monitoringService.getRecentAlerts();
  }

  @Post('alert')
  async createAlert(@Body() alertData: {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    metadata?: any;
  }): Promise<{ success: boolean }> {
    await this.monitoringService.createAlert(alertData as any);
    return { success: true };
  }
}