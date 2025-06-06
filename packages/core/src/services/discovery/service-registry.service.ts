import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ServiceMetadata {
  serviceName: string;
  serviceType: string;
  version: string;
  endpoint: string;
  capabilities: string[];
  healthCheckUrl?: string;
  tags?: string[];
  description?: string;
  registeredAt: Date;
  lastHeartbeat: Date;
  status: 'active' | 'inactive' | 'error';
}

export interface ServiceDiscoveryOptions {
  serviceType?: string;
  requiredCapabilities?: string[];
  tags?: string[];
  healthCheck?: boolean;
}

@Injectable()
export class ServiceRegistryService {
  private services: Map<string, ServiceMetadata> = new Map();
  private heartbeatInterval: number = 30000; // 30 seconds

  constructor(
    private readonly configService: ConfigService
  ) {
    this.heartbeatInterval = this.configService.get<number>('serviceRegistry.heartbeatInterval', 30000);
    this.startHeartbeatMonitoring();
  }

  public async registerService(
    serviceName: string, 
    metadata: Omit<ServiceMetadata, 'serviceName' | 'registeredAt' | 'lastHeartbeat'>
  ): Promise<ServiceMetadata> {
    const serviceMetadata: ServiceMetadata = {
      ...metadata,
      serviceName,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      status: 'active'
    };

    this.services.set(serviceName, serviceMetadata);
    
    console.log(`Service registered: ${serviceName} (${metadata.serviceType})`);
    
    return serviceMetadata;
  }

  public async unregisterService(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    this.services.delete(serviceName);
    console.log(`Service unregistered: ${serviceName}`);
  }

  public async discoverServices(options: ServiceDiscoveryOptions = {}): Promise<ServiceMetadata[]> {
    let services = Array.from(this.services.values());

    // Filter by service type
    if (options.serviceType) {
      services = services.filter(service => service.serviceType === options.serviceType);
    }

    // Filter by required capabilities
    if (options.requiredCapabilities && options.requiredCapabilities.length > 0) {
      services = services.filter(service => 
        options.requiredCapabilities!.every(capability => 
          service.capabilities.includes(capability)
        )
      );
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      services = services.filter(service => 
        service.tags && options.tags!.some(tag => service.tags!.includes(tag))
      );
    }

    // Filter by status (only return active services by default)
    services = services.filter(service => service.status === 'active');

    // Perform health checks if requested
    if (options.healthCheck) {
      const healthyServices: ServiceMetadata[] = [];
      for (const service of services) {
        const isHealthy = await this.performHealthCheck(service);
        if (isHealthy) {
          healthyServices.push(service);
        }
      }
      services = healthyServices;
    }

    return services;
  }

  public async getService(serviceName: string): Promise<ServiceMetadata | undefined> {
    return this.services.get(serviceName);
  }

  public async updateServiceHeartbeat(serviceName: string): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    service.lastHeartbeat = new Date();
    service.status = 'active';
    
    console.log(`Heartbeat updated for service: ${serviceName}`);
  }

  public async updateServiceMetadata(
    serviceName: string, 
    updates: Partial<ServiceMetadata>
  ): Promise<ServiceMetadata> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    const updatedService = { ...service, ...updates };
    this.services.set(serviceName, updatedService);
    
    console.log(`Service metadata updated: ${serviceName}`);
    
    return updatedService;
  }

  public getAllServices(): ServiceMetadata[] {
    return Array.from(this.services.values());
  }

  public getServicesByType(serviceType: string): ServiceMetadata[] {
    return Array.from(this.services.values())
      .filter(service => service.serviceType === serviceType);
  }

  public getServicesByCapability(capability: string): ServiceMetadata[] {
    return Array.from(this.services.values())
      .filter(service => service.capabilities.includes(capability));
  }

  private async performHealthCheck(service: ServiceMetadata): Promise<boolean> {
    if (!service.healthCheckUrl) {
      // If no health check URL, assume service is healthy if heartbeat is recent
      const now = new Date();
      const timeSinceHeartbeat = now.getTime() - service.lastHeartbeat.getTime();
      return timeSinceHeartbeat < this.heartbeatInterval * 2; // Allow 2x heartbeat interval
    }

    try {
      // In a real implementation, you would make an HTTP request to the health check URL
      // For now, this is a placeholder
      console.log(`Performing health check for ${service.serviceName} at ${service.healthCheckUrl}`);
      return true; // Placeholder
    } catch {
      return false;
    }
  }

  private startHeartbeatMonitoring(): void {
    setInterval(() => {
      this.checkServiceHeartbeats();
    }, this.heartbeatInterval);
  }

  private checkServiceHeartbeats(): void {
    const now = new Date();
    const staleThreshold = this.heartbeatInterval * 3; // 3x heartbeat interval

    for (const [serviceName, service] of this.services.entries()) {
      const timeSinceHeartbeat = now.getTime() - service.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > staleThreshold) {
        if (service.status !== 'inactive') {
          service.status = 'inactive';
          console.warn(`Service marked as inactive due to stale heartbeat: ${serviceName}`);
        }
      }
    }
  }
}