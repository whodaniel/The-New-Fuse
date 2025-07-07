export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: Record<string, ServiceHealth>;
  system: SystemHealth;
  uptime: number;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
}

export interface SystemHealth {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
}

export class HealthService {
  private services: Map<string, ServiceHealth> = new Map();

  async getHealthStatus(): Promise<HealthStatus> {
    const system = await this.getSystemHealth();
    const services = this.getAllServiceHealth();
    
    const overallStatus = this.calculateOverallStatus(services, system);
    
    return {
      status: overallStatus,
      timestamp: new Date(),
      services,
      system,
      uptime: process.uptime()
    };
  }

  async checkService(name: string, healthCheckFn: () => Promise<boolean>): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await healthCheckFn();
      const responseTime = Date.now() - startTime;
      
      const health: ServiceHealth = {
        status: isHealthy ? 'up' : 'down',
        responseTime,
        lastCheck: new Date()
      };
      
      this.services.set(name, health);
      return health;
    } catch (error) {
      const health: ServiceHealth = {
        status: 'down',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: (error as Error).message
      };
      
      this.services.set(name, health);
      return health;
    }
  }

  private getAllServiceHealth(): Record<string, ServiceHealth> {
    const result: Record<string, ServiceHealth> = {};
    this.services.forEach((health, name) => {
      result[name] = health;
    });
    return result;
  }

  private async getSystemHealth(): Promise<SystemHealth> {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cpu: {
        usage: 0 // Mock value - in real implementation would calculate CPU usage
      },
      disk: {
        used: 0, // Mock value
        total: 0, // Mock value
        percentage: 0 // Mock value
      }
    };
  }

  private calculateOverallStatus(services: Record<string, ServiceHealth>, system: SystemHealth): 'healthy' | 'degraded' | 'unhealthy' {
    const serviceStatuses = Object.values(services);
    
    // If any critical service is down, overall status is unhealthy
    const downServices = serviceStatuses.filter(s => s.status === 'down');
    if (downServices.length > 0) {
      return 'unhealthy';
    }
    
    // If any service is degraded or system metrics are concerning, status is degraded
    const degradedServices = serviceStatuses.filter(s => s.status === 'degraded');
    if (degradedServices.length > 0 || system.memory.percentage > 90) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}