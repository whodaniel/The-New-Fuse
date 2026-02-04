/**
 * Proxy Controller
 * Health checks and service discovery for the API Gateway
 */

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';

@Controller('proxy')
@ApiTags('health')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check health of all backend services' })
  @ApiResponse({ status: 200, description: 'Health status of all services' })
  async getServicesHealth() {
    const servicesHealth = await this.proxyService.getAllServicesHealth();
    const allHealthy = Object.values(servicesHealth).every(Boolean);

    return {
      gateway: 'healthy',
      services: servicesHealth,
      overall: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('services')
  @ApiOperation({ summary: 'Get registered services configuration' })
  @ApiResponse({ status: 200, description: 'List of registered services' })
  async getServices() {
    const services = this.proxyService.getAllServices();

    return {
      count: services.length,
      services: services.map((service) => ({
        name: service.name,
        baseUrl: service.baseUrl,
        healthPath: service.healthPath,
      })),
    };
  }
}
