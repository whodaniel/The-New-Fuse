/**
 * Relay Core Integration
 *
 * This module provides integration with The New Fuse Relay Core package,
 * enabling MCP services to participate in the platform's communication relay system.
 */

// Optional integration with relay-core
let relayCore: any = null;

try {
  relayCore = require('@the-new-fuse/relay-core');
} catch (error) {
  // relay-core is not available, gracefully degrade
  console.log('relay-core not available, running in standalone mode');
}

export interface RelayIntegrationConfig {
  enabled: boolean;
  autoRegister: boolean;
  heartbeatInterval: number;
  retryAttempts: number;
  retryDelay: number;
  namespace: string;
}

export interface RelayServiceInfo {
  id: string;
  name: string;
  type: 'mcp-server' | 'mcp-client' | 'mcp-broker';
  version: string;
  endpoint: string;
  capabilities: string[];
  metadata: {
    protocol: 'mcp';
    mcpVersion: string;
    resources: any[];
    tools: any[];
    [key: string]: any;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    responseTime: number;
  };
}

/**
 * Relay Core Integration Bridge
 * Connects MCP Core with the platform's relay communication system
 */
export const RelayIntegration = {
  isAvailable: !!relayCore,

  /**
   * Register MCP service with relay core
   */
  async registerMCPService(
    serviceInfo: any,
    config?: Partial<RelayIntegrationConfig>
  ): Promise<boolean> {
    if (!relayCore || !relayCore.registerService) {
      return false;
    }

    try {
      const relayServiceInfo: RelayServiceInfo = {
        id: serviceInfo.id,
        name: serviceInfo.name,
        type: 'mcp-server',
        version: serviceInfo.version,
        endpoint: serviceInfo.endpoint,
        capabilities: serviceInfo.capabilities,
        metadata: {
          protocol: 'mcp',
          mcpVersion: '1.0.0',
          resources: serviceInfo.resources || [],
          tools: serviceInfo.tools || [],
          ...serviceInfo.metadata,
        },
        health: {
          status: 'healthy',
          lastCheck: new Date(),
          responseTime: 0,
        },
      };

      const result = await relayCore.registerService('mcp', relayServiceInfo);

      if (config?.autoRegister && result) {
        // Set up automatic heartbeat
        this.setupHeartbeat(serviceInfo.id, config);
      }

      return result;
    } catch (error) {
      console.error('Failed to register MCP service with relay core:', error);
      return false;
    }
  },

  /**
   * Unregister MCP service from relay core
   */
  async unregisterMCPService(serviceId: string): Promise<boolean> {
    if (!relayCore || !relayCore.unregisterService) {
      return false;
    }

    try {
      return await relayCore.unregisterService('mcp', serviceId);
    } catch (error) {
      console.error('Failed to unregister MCP service from relay core:', error);
      return false;
    }
  },

  /**
   * Get shared configuration from relay core
   */
  getSharedConfig(key?: string): any {
    if (!relayCore || !relayCore.getConfig) {
      return {};
    }

    try {
      const config = relayCore.getConfig('mcp');
      return key ? config[key] : config;
    } catch (error) {
      console.error('Failed to get shared config from relay core:', error);
      return {};
    }
  },

  /**
   * Send message through relay core
   */
  async sendMessage(
    targetService: string,
    message: any,
    options?: {
      timeout?: number;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      retries?: number;
    }
  ): Promise<any> {
    if (!relayCore || !relayCore.sendMessage) {
      throw new Error('Relay core not available for message sending');
    }

    try {
      const relayMessage = {
        id: `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'mcp-core',
        target: targetService,
        type: 'mcp.message',
        timestamp: new Date().toISOString(),
        data: message,
        metadata: {
          priority: options?.priority || 'normal',
          timeout: options?.timeout || 30000,
          retries: options?.retries || 3,
        },
      };

      return await relayCore.sendMessage(relayMessage);
    } catch (error) {
      console.error('Failed to send message through relay core:', error);
      throw error;
    }
  },

  /**
   * Subscribe to relay core events
   */
  subscribeToEvents(eventTypes: string[], callback: (event: any) => void): () => void {
    if (!relayCore || !relayCore.subscribe) {
      return () => {}; // Return empty cleanup function
    }

    try {
      const subscription = relayCore.subscribe(eventTypes, (event: any) => {
        // Filter for MCP-related events
        if (event.source === 'mcp-core' || event.type?.startsWith('mcp.')) {
          callback(event);
        }
      });

      return () => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error('Failed to subscribe to relay core events:', error);
      return () => {};
    }
  },

  /**
   * Publish event to relay core
   */
  async publishEvent(eventType: string, data: any, metadata?: any): Promise<boolean> {
    if (!relayCore || !relayCore.publishEvent) {
      return false;
    }

    try {
      const event = {
        id: `mcp_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: `mcp.${eventType}`,
        source: 'mcp-core',
        timestamp: new Date().toISOString(),
        data,
        metadata: {
          version: '1.0.0',
          ...metadata,
        },
      };

      return await relayCore.publishEvent(event);
    } catch (error) {
      console.error('Failed to publish event to relay core:', error);
      return false;
    }
  },

  /**
   * Get service discovery from relay core
   */
  async discoverServices(query?: {
    type?: string;
    capabilities?: string[];
    tags?: string[];
    namespace?: string;
  }): Promise<RelayServiceInfo[]> {
    if (!relayCore || !relayCore.discoverServices) {
      return [];
    }

    try {
      const services = await relayCore.discoverServices({
        namespace: 'mcp',
        ...query,
      });

      return services.filter((service: any) => service.metadata?.protocol === 'mcp');
    } catch (error) {
      console.error('Failed to discover services through relay core:', error);
      return [];
    }
  },

  /**
   * Setup heartbeat for service health monitoring
   */
  setupHeartbeat(
    serviceId: string,
    config: Partial<RelayIntegrationConfig>
  ): NodeJS.Timeout | null {
    if (!relayCore || !relayCore.updateServiceHealth) {
      return null;
    }

    const interval = config.heartbeatInterval || 30000; // 30 seconds default

    return setInterval(async () => {
      try {
        const healthInfo = {
          status: 'healthy' as const,
          lastCheck: new Date(),
          responseTime: Date.now(), // This should be measured properly
        };

        await relayCore.updateServiceHealth('mcp', serviceId, healthInfo);
      } catch (error) {
        console.error('Failed to send heartbeat to relay core:', error);
      }
    }, interval);
  },

  /**
   * Get relay core status and metrics
   */
  async getRelayStatus(): Promise<{
    connected: boolean;
    services: number;
    messagesSent: number;
    messagesReceived: number;
    lastActivity: Date;
  }> {
    if (!relayCore || !relayCore.getStatus) {
      return {
        connected: false,
        services: 0,
        messagesSent: 0,
        messagesReceived: 0,
        lastActivity: new Date(0),
      };
    }

    try {
      return await relayCore.getStatus();
    } catch (error) {
      console.error('Failed to get relay core status:', error);
      return {
        connected: false,
        services: 0,
        messagesSent: 0,
        messagesReceived: 0,
        lastActivity: new Date(0),
      };
    }
  },
};

/**
 * Default configuration for relay integration
 */
export const DEFAULT_RELAY_CONFIG: RelayIntegrationConfig = {
  enabled: true,
  autoRegister: true,
  heartbeatInterval: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  namespace: 'mcp',
};

/**
 * Relay Core Event Types for MCP
 */
export const MCP_RELAY_EVENTS = {
  SERVICE_REGISTERED: 'service.registered',
  SERVICE_UNREGISTERED: 'service.unregistered',
  SERVICE_HEALTH_CHANGED: 'service.health.changed',
  MESSAGE_SENT: 'message.sent',
  MESSAGE_RECEIVED: 'message.received',
  MESSAGE_FAILED: 'message.failed',
  CONNECTION_ESTABLISHED: 'connection.established',
  CONNECTION_LOST: 'connection.lost',
  ERROR_OCCURRED: 'error.occurred',
} as const;

/**
 * Relay Integration Factory
 * Creates pre-configured relay integration instances
 */
export class RelayIntegrationFactory {
  static create(config?: Partial<RelayIntegrationConfig>) {
    const finalConfig = { ...DEFAULT_RELAY_CONFIG, ...config };

    return {
      config: finalConfig,
      integration: RelayIntegration,

      async initialize() {
        if (!RelayIntegration.isAvailable) {
          console.log('Relay core not available, skipping initialization');
          return false;
        }

        try {
          // Perform any initialization tasks
          const status = await RelayIntegration.getRelayStatus();
          console.log('Relay core integration initialized:', status);
          return true;
        } catch (error) {
          console.error('Failed to initialize relay core integration:', error);
          return false;
        }
      },

      async registerService(serviceInfo: any) {
        return await RelayIntegration.registerMCPService(serviceInfo, finalConfig);
      },

      createEventBridge() {
        const subscriptions = new Map<string, () => void>();

        return {
          subscribe: (eventType: string, callback: (event: any) => void) => {
            const cleanup = RelayIntegration.subscribeToEvents([eventType], callback);
            subscriptions.set(eventType, cleanup);
            return cleanup;
          },

          publish: async (eventType: string, data: any, metadata?: any) => {
            return await RelayIntegration.publishEvent(eventType, data, metadata);
          },

          cleanup: () => {
            for (const cleanup of subscriptions.values()) {
              cleanup();
            }
            subscriptions.clear();
          },
        };
      },
    };
  }
}

export default RelayIntegration;
