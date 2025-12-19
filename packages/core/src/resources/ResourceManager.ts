import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { performance } from 'perf_hooks';
import * as os from 'os';

export interface ResourceUsage {
  cpu: NodeJS.CpuUsage;
  memory: NodeJS.MemoryUsage;
  uptime: number;
}

@Injectable()
export class ResourceManager implements OnModuleDestroy {
  private readonly logger = new Logger(ResourceManager.name);
  private readonly monitoringInterval: NodeJS.Timeout;
  private allocatedResources = new Map<string, any>();

  constructor() {
    this.monitoringInterval = setInterval(() => this.logResourceUsage(), 300000); // Log every 5 minutes
    this.logResourceUsage(); // Log initial usage
  }

  onModuleDestroy() {
    clearInterval(this.monitoringInterval);
  }

  getCurrentUsage(): ResourceUsage {
    return {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  allocateResource<T>(consumerId: string, resource: T): boolean {
    if (this.allocatedResources.has(consumerId)) {
      this.logger.warn(`Consumer '${consumerId}' has already allocated a resource.`);
      return false;
    }
    this.allocatedResources.set(consumerId, resource);
    this.logger.log(`Resource allocated for consumer: ${consumerId}`);
    return true;
  }

  getResource<T>(consumerId: string): T | undefined {
    return this.allocatedResources.get(consumerId) as T;
  }

  releaseResource(consumerId: string): boolean {
    if (!this.allocatedResources.has(consumerId)) {
      this.logger.warn(`No resource allocated for consumer '${consumerId}' to release.`);
      return false;
    }
    this.allocatedResources.delete(consumerId);
    this.logger.log(`Resource released for consumer: ${consumerId}`);
    return true;
  }

  private logResourceUsage(): void {
    const usage = this.getCurrentUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsagePercentage = ((totalMemory - freeMemory) / totalMemory) * 100;

    this.logger.log('System Resource Usage:', {
      ...usage,
      totalMemory: `${(totalMemory / 1024 / 1024).toFixed(2)} MB`,
      freeMemory: `${(freeMemory / 1024 / 1024).toFixed(2)} MB`,
      memoryUsagePercentage: `${memoryUsagePercentage.toFixed(2)}%`,
    });
  }
}
