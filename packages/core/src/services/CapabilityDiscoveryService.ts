import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger';
import { ReliabilityMetricsService } from './ReliabilityMetricsService';
import { CapabilitySecurityService } from './CapabilitySecurityService';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { compareVersions } from '../utils/version';

export interface Capability {
  id: string;
  name: string;
  version: string;
  description: string;
  endpoints: string[];
  methods: string[];
  requirements?: string[];
  context?: any;
}

@Injectable()
export class CapabilityDiscoveryService {
  private readonly logger = new Logger(CapabilityDiscoveryService.name);
  private capabilities = new Map<string, Capability>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly reliabilityMetrics: ReliabilityMetricsService,
    private readonly securityService: CapabilitySecurityService
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.eventEmitter.on('capability.registered', (data) => {
      this.logger.log('Capability registered', data);
    });
    this.eventEmitter.on('capability.updated', (data) => {
      this.logger.log('Capability updated', data);
    });
  }

  async registerCapability(capability: Capability): Promise<void> {
    this.capabilities.set(capability.id, capability);
    this.eventEmitter.emit('capability.registered', capability);
  }

  async getCapabilities(context?: any): Promise<Capability[]> {
    const capabilities = Array.from(this.capabilities.values());
    return context ? this.filterByContext(capabilities, context) : capabilities;
  }

  private filterByContext(capabilities: Capability[], context: any): Capability[] {
    return capabilities.filter(cap => {
      if (!cap.context) return true;
      return Object.keys(cap.context).every(key => cap.context[key] === context[key]);
    });
  }

  async discoverCapabilities(requirements: string[]): Promise<Capability[]> {
    const key = requirements.sort().join('-');
    const capabilities = Array.from(this.capabilities.values());

    return capabilities.filter(cap => {
      if (!cap.requirements) return false;
      return requirements.every(req => cap.requirements?.includes(req));
    });
  }

  async composeCapabilities(requirements: string[]): Promise<Capability> {
    const capabilities = await this.discoverCapabilities(requirements);

    return {
      id: `composed-${Date.now()}`,
      name: `Composition-${requirements.join('-')}`,
      version: '1.0.0',
      description: 'Composed capability',
      endpoints: capabilities.flatMap(c => c.endpoints),
      methods: capabilities.flatMap(c => c.methods),
      requirements
    };
  }

  private isPlaceholder(obj: any): boolean {
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => {
        if (typeof value === 'string' && value === 'placeholder') {
          return true;
        } else if (typeof value === 'object') {
          return this.isPlaceholder(value);
        }
        return false;
      });
    }
    return false;
  }

  async validateCapability(capability: Capability): Promise<boolean> {
    try {
      if (!capability.id || !capability.name || !capability.version) {
        return false;
      }

      if (this.isPlaceholder(capability)) {
        this.logger.error('Capability contains placeholder values', capability);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Capability validation failed', error);
      return false;
    }
  }
}
