// packages/port-management/src/services/port-registry.service.ts

import { EventEmitter } from 'events';
import * as net from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PortRegistration {
  id: string;
  port: number;
  serviceName: string;
  serviceType: 'frontend' | 'api' | 'backend' | 'broker' | 'database' | 'other';
  environment: 'development' | 'staging' | 'production' | 'test';
  status: 'active' | 'reserved' | 'conflict' | 'inactive';
  processId?: number;
  host: string;
  protocol: 'http' | 'https' | 'ws' | 'wss' | 'tcp' | 'udp';
  healthCheckUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  reservedUntil?: Date;
  metadata: Record<string, any>;
}

export interface PortConflict {
  port: number;
  conflictingServices: PortRegistration[];
  suggestedResolutions: PortResolution[];
}

export interface PortResolution {
  type: 'reassign' | 'terminate' | 'merge';
  targetService: string;
  newPort?: number;
  description: string;
}

export interface ServiceConfiguration {
  serviceName: string;
  environment: string;
  preferredPort?: number;
  fallbackPorts: number[];
  autoAssign: boolean;
  portRangeMin: number;
  portRangeMax: number;
  healthCheck?: {
    path: string;
    interval: number;
    timeout: number;
  };
}

export class PortRegistryService extends EventEmitter {
  private registry: Map<string, PortRegistration> = new Map();
  private configurations: Map<string, ServiceConfiguration> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.loadConfigurations();
  }

  /**
   * Register a port for a service
   */
  async registerPort(config: {
    serviceName: string;
    serviceType: PortRegistration['serviceType'];
    environment: string;
    port?: number;
    host?: string;
    protocol?: PortRegistration['protocol'];
    healthCheckUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<PortRegistration> {
    const {
      serviceName,
      serviceType,
      environment,
      host = 'localhost',
      protocol = 'http',
      healthCheckUrl,
      metadata = {}
    } = config;

    let { port } = config;

    // If no port specified, find an available one
    if (!port) {
      port = await this.findAvailablePort(serviceName, environment);
    }

    const registration: PortRegistration = {
      id: `${serviceName}-${environment}-${port}`,
      port,
      serviceName,
      serviceType,
      environment,
      status: 'active',
      host,
      protocol,
      healthCheckUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata
    };

    this.registry.set(registration.id, registration);
    this.emit('portRegistered', registration);

    return registration;
  }

  /**
   * Find an available port for a service
   */
  async findAvailablePort(serviceName: string, environment: string): Promise<number> {
    const config = this.getServiceConfiguration(serviceName, environment);
    
    // Try preferred port first
    if (config.preferredPort && await this.isPortAvailable(config.preferredPort)) {
      return config.preferredPort;
    }

    // Try fallback ports
    for (const port of config.fallbackPorts) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    // Auto-assign from range
    if (config.autoAssign) {
      for (let port = config.portRangeMin; port <= config.portRangeMax; port++) {
        if (await this.isPortAvailable(port)) {
          return port;
        }
      }
    }

    throw new Error(`No available ports found for service ${serviceName} in environment ${environment}`);
  }

  /**
   * Check if a port is available
   */
  async isPortAvailable(port: number, host: string = 'localhost'): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, host, () => {
        server.once('close', () => resolve(true));
        server.close();
      });

      server.on('error', () => resolve(false));
    });
  }

  /**
   * Detect port conflicts
   */
  async detectConflicts(): Promise<PortConflict[]> {
    return [];
  }

  /**
   * Reassign a port
   */
  async reassignPort(serviceId: string, newPort: number): Promise<void> {
    const registration = this.registry.get(serviceId);
    if (!registration) {
      throw new Error(`Service registration ${serviceId} not found`);
    }

    registration.port = newPort;
    registration.updatedAt = new Date();
    this.registry.set(serviceId, registration);
  }

  /**
   * Get service configuration
   */
  private getServiceConfiguration(serviceName: string, environment: string): ServiceConfiguration {
    const key = `${serviceName}-${environment}`;
    return this.configurations.get(key) || {
      serviceName,
      environment,
      fallbackPorts: [],
      autoAssign: true,
      portRangeMin: 3000,
      portRangeMax: 9999
    };
  }

  /**
   * Load service configurations
   */
  private async loadConfigurations(): Promise<void> {
    const defaultConfigs: ServiceConfiguration[] = [
      {
        serviceName: 'frontend',
        environment: 'development',
        preferredPort: 3000,
        fallbackPorts: [3010, 3020, 3030],
        autoAssign: true,
        portRangeMin: 3000,
        portRangeMax: 3099
      },
      {
        serviceName: 'api',
        environment: 'development',
        preferredPort: 3001,
        fallbackPorts: [3011, 3021, 3031],
        autoAssign: true,
        portRangeMin: 3001,
        portRangeMax: 3199
      }
    ];

    for (const config of defaultConfigs) {
      const key = `${config.serviceName}-${config.environment}`;
      this.configurations.set(key, config);
    }
  }

  getAllRegistrations(): PortRegistration[] {
    return Array.from(this.registry.values());
  }

  findByPort(port: number): PortRegistration | undefined {
    return Array.from(this.registry.values()).find(reg => reg.port === port);
  }

  getByService(serviceName: string, environment?: string): PortRegistration[] {
    return Array.from(this.registry.values()).filter(reg => 
      reg.serviceName === serviceName && 
      (!environment || reg.environment === environment)
    );
  }

  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.removeAllListeners();
  }
}
