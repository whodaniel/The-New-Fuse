import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ServiceMetadata {
  serviceName: string;
  status: 'active' | 'inactive';
  registeredAt: Date;
  lastHeartbeat: Date;
}

@Injectable()
export class ServiceRegistryService {
  private readonly logger = new Logger(ServiceRegistryService.name);
  private services = new Map<string, ServiceMetadata>();
  private heartbeatInterval: number;

  constructor(private readonly configService: ConfigService) {
    this.heartbeatInterval = this.configService.get<number>('serviceRegistry.heartbeatInterval');
    setInterval(() => this.checkServiceHealth(), this.heartbeatInterval);
  }

  registerService(serviceName: string, metadata: Omit<ServiceMetadata, 'serviceName' | 'registeredAt' | 'lastHeartbeat'>) {
    this.services.set(serviceName, {
      ...metadata,
      serviceName,
      status: 'active',
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
    });
    this.logger.log(`Service ${serviceName} registered.`);
  }

  deregisterService(serviceName: string) {
    this.services.delete(serviceName);
    this.logger.log(`Service ${serviceName} deregistered.`);
  }

  getService(serviceName: string) {
    return this.services.get(serviceName);
  }

  listServices() {
    return Array.from(this.services.values());
  }

  private checkServiceHealth() {
    for (const [serviceName, service] of this.services.entries()) {
      if (Date.now() - service.lastHeartbeat.getTime() > this.heartbeatInterval) {
        service.status = 'inactive';
        this.logger.warn(`Service ${serviceName} is inactive.`);
      }
    }
  }

  updateServiceStatus(serviceName: string, status: 'active' | 'inactive') {
    const service = this.services.get(serviceName);
    if (service) {
      service.status = status;
    }
  }
}
