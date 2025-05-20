import { Integration, IntegrationType, IntegrationRegistry } from './types.js';
import { EventEmitter } from 'events';

/**
 * Event types emitted by IntegrationRegistryImpl
 */
export enum IntegrationEvent {
  REGISTERED = 'integration:registered',
  REMOVED = 'integration:removed',
  CONNECTED = 'integration:connected',
  DISCONNECTED = 'integration:disconnected',
  UPDATED = 'integration:updated',
  ERROR = 'integration:error'
}

/**
 * A central registry for managing all API integrations
 */
export class IntegrationRegistryImpl implements IntegrationRegistry {
  private integrations: Map<string, Integration> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private logger;
  
  constructor(private loggingService: LoggingService) {
    this.logger = this.loggingService.createLogger('IntegrationRegistry');
  }
  
  /**
   * Register a new integration
   */
  registerIntegration(integration: Integration): void {
    if (this.integrations.has(integration.id)) {
      this.logger.warn(`Integration with ID ${integration.id} already exists. Replacing.`);
    }
    
    this.integrations.set(integration.id, integration);
    this.eventEmitter.emit(IntegrationEvent.REGISTERED, integration);
    this.logger.info(`Registered integration: ${integration.name} (${integration.id})`);
  }
  
  /**
   * Get an integration by ID
   */
  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id);
  }
  
  /**
   * Check if an integration exists by ID
   */
  hasIntegration(id: string): boolean {
    return this.integrations.has(id);
  }
  
  /**
   * Get all registered integrations
   */
  getIntegrations(): Integration[] {
    return Array.from(this.integrations.values());
  }
  
  /**
   * Get integrations by type
   */
  getIntegrationsByType(type: IntegrationType): Integration[] {
    return this.getIntegrations().filter(integration => integration.type === type);
  }
  
  /**
   * Remove an integration by ID
   */
  removeIntegration(id: string): boolean {
    const integration = this.getIntegration(id);
    
    if (integration) {
      const result = this.integrations.delete(id);
      
      if (result) {
        this.eventEmitter.emit(IntegrationEvent.REMOVED, integration);
        this.logger.info(`Removed integration: ${integration.name} (${integration.id})`);
      }
      
      return result;
    }
    
    return false;
  }
  
  /**
   * Connect to an integration
   */
  async connectIntegration(id: string): Promise<boolean> {
    const integration = this.getIntegration(id);
    
    if (!integration) {
      this.logger.error(`Integration with ID ${id} not found`);
      return false;
    }
    
    try {
      const connected = await integration.connect();
      
      if (connected) {
        this.eventEmitter.emit(IntegrationEvent.CONNECTED, integration);
        this.logger.info(`Connected to integration: ${integration.name} (${integration.id})`);
      }
      
      return connected;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to connect to integration: ${integration.name} (${integration.id})`, {
          error: error.message,
          stack: error.stack
        });
      } else {
        this.logger.error(`Failed to connect to integration: ${integration.name} (${integration.id})`, {
          error: String(error)
        });
      }
      this.eventEmitter.emit(IntegrationEvent.ERROR, {
        integration,
        error,
        operation: 'connect'
      });
      return false;
    }
  }
  
  /**
   * Disconnect from an integration
   */
  async disconnectIntegration(id: string): Promise<boolean> {
    const integration = this.getIntegration(id);
    
    if (!integration) {
      this.logger.error(`Integration with ID ${id} not found`);
      return false;
    }
    
    try {
      const disconnected = await integration.disconnect();
      
      if (disconnected) {
        this.eventEmitter.emit(IntegrationEvent.DISCONNECTED, integration);
        this.logger.info(`Disconnected from integration: ${integration.name} (${integration.id})`);
      }
      
      return disconnected;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to disconnect from integration: ${integration.name} (${integration.id})`, {
          error: error.message,
          stack: error.stack
        });
      } else {
        this.logger.error(`Failed to disconnect from integration: ${integration.name} (${integration.id})`, {
          error: String(error)
        });
      }
      this.eventEmitter.emit(IntegrationEvent.ERROR, {
        integration,
        error,
        operation: 'disconnect'
      });
      return false;
    }
  }
  
  /**
   * Execute an action on an integration
   */
  async executeAction(integrationId: string, action: string, params: Record<string, any> = {}): Promise<any> {
    const integration = this.getIntegration(integrationId);
    
    if (!integration) {
      throw new Error(`Integration with ID ${integrationId} not found`);
    }
    
    if (!integration.isConnected) {
      throw new Error(`Integration ${integration.name} is not connected. Connect first.`);
    }
    
    try {
      this.logger.debug(`Executing action ${action} on ${integration.name} (${integration.id})`, { params });
      return await integration.execute(action, params);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to execute action ${action} on ${integration.name} (${integration.id})`, {
          error: error.message,
          stack: error.stack,
          params
        });
      } else {
        this.logger.error(`Failed to execute action ${action} on ${integration.name} (${integration.id})`, {
          error: String(error),
          params
        });
      }
      this.eventEmitter.emit(IntegrationEvent.ERROR, {
        integration,
        error,
        operation: 'execute',
        action,
        params
      });
      throw error;
    }
  }
  
  /**
   * Get metadata for all integrations
   */
  async getIntegrationsMetadata(): Promise<Record<string, any>[]> {
    const metadataPromises = this.getIntegrations().map(async integration => {
      try {
        return await integration.getMetadata();
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(`Failed to get metadata for ${integration.name} (${integration.id})`, {
            error: error.message,
            stack: error.stack
          });
        } else {
          this.logger.error(`Failed to get metadata for ${integration.name} (${integration.id})`, {
            error: String(error)
          });
        }
        return {
          id: integration.id,
          name: integration.name,
          type: integration.type,
          isConnected: integration.isConnected,
          isEnabled: integration.isEnabled,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    return Promise.all(metadataPromises);
  }
  
  /**
   * Subscribe to integration events
   */
  on(event: IntegrationEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * Unsubscribe from integration events
   */
  off(event: IntegrationEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
}

/**
 * Replace LoggingService with a minimal local logger implementation or a placeholder
 */
class LoggingService {
  info(...args: any[]) { console.info(...args); }
  warn(...args: any[]) { console.warn(...args); }
  error(...args: any[]) { console.error(...args); }
  debug(...args: any[]) { console.debug(...args); }
  createLogger(_name?: string) { return this; }
}