/**
 * Base service class providing common functionality for all agent services
 */
import { EventEmitter } from 'events';

export interface ServiceConfig {
  name: string;
  enabled?: boolean;
  [key: string]: any;
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'initializing';
  uptime?: number;
  lastError?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseService extends EventEmitter {
  protected name: string;
  protected config: ServiceConfig;
  protected startTime?: Date;
  protected isRunning: boolean = false;

  constructor(config: ServiceConfig) {
    super();
    this.name = config.name;
    this.config = config;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    this.emit('initializing', this.name);
    try {
      await this.onInitialize();
      this.isRunning = true;
      this.startTime = new Date();
      this.emit('initialized', this.name);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.emit('starting', this.name);
    try {
      await this.onStart();
      this.isRunning = true;
      this.startTime = new Date();
      this.emit('started', this.name);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.emit('stopping', this.name);
    try {
      await this.onStop();
      this.isRunning = false;
      this.startTime = undefined;
      this.emit('stopped', this.name);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  getStatus(): ServiceStatus {
    return {
      name: this.name,
      status: this.isRunning ? 'running' : 'stopped',
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : undefined,
      metadata: this.getStatusMetadata(),
    };
  }

  /**
   * Check if service is running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Get service name
   */
  get serviceName(): string {
    return this.name;
  }

  /**
   * Override in subclasses for custom initialization logic
   */
  protected async onInitialize(): Promise<void> {
    // Default implementation - override in subclasses
  }

  /**
   * Override in subclasses for custom start logic
   */
  protected async onStart(): Promise<void> {
    // Default implementation - override in subclasses
  }

  /**
   * Override in subclasses for custom stop logic
   */
  protected async onStop(): Promise<void> {
    // Default implementation - override in subclasses
  }

  /**
   * Override in subclasses to provide additional status metadata
   */
  protected getStatusMetadata(): Record<string, any> {
    return {};
  }
}
