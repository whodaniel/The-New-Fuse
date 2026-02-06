/**
 * Platform Types Integration
 *
 * This module provides integration with The New Fuse shared types package,
 * ensuring compatibility between MCP Core and the broader platform ecosystem.
 */

// Optional integration with platform types
let platformTypes: any = null;

try {
  platformTypes = require('@the-new-fuse/types');
} catch (error) {
  // Platform types not available, use local definitions
  console.log('Platform types not available, using local MCP types');
}

export interface PlatformIntegrationConfig {
  enableSharedTypes: boolean;
  enableCommunicationBridge: boolean;
  enableDatabaseIntegration: boolean;
  enableRelayCore: boolean;
}

/**
 * Platform Types Bridge
 * Maps between MCP Core types and platform shared types
 */
export const PlatformTypesBridge = {
  isAvailable: !!platformTypes,

  /**
   * Map MCP Service Info to platform Agent type
   */
  mapServiceToAgent: (serviceInfo: any) => {
    if (platformTypes && platformTypes.AgentTypes) {
      return {
        id: serviceInfo.id,
        name: serviceInfo.name,
        version: serviceInfo.version,
        type: 'mcp-service',
        capabilities: serviceInfo.capabilities,
        metadata: {
          ...serviceInfo.metadata,
          mcpEndpoint: serviceInfo.endpoint,
          mcpResources: serviceInfo.resources,
          mcpTools: serviceInfo.tools,
          mcpStatus: serviceInfo.status,
        },
        createdAt: serviceInfo.registeredAt,
        updatedAt: serviceInfo.lastHeartbeat,
      };
    }
    return serviceInfo;
  },

  /**
   * Map platform Agent type to MCP Service Info
   */
  mapAgentToService: (agent: any) => {
    if (platformTypes && agent.metadata?.mcpEndpoint) {
      return {
        id: agent.id,
        name: agent.name,
        version: agent.version || '1.0.0',
        endpoint: agent.metadata.mcpEndpoint,
        capabilities: agent.capabilities || [],
        resources: agent.metadata.mcpResources || [],
        tools: agent.metadata.mcpTools || [],
        status: agent.metadata.mcpStatus || 'ONLINE',
        metadata: agent.metadata,
        registeredAt: agent.createdAt,
        lastHeartbeat: agent.updatedAt,
        healthScore: agent.metadata.healthScore || 1.0,
        tags: agent.tags || [],
      };
    }
    return null;
  },

  /**
   * Get platform communication types
   */
  getCommunicationTypes: () => {
    if (platformTypes && platformTypes.CommunicationTypes) {
      return platformTypes.CommunicationTypes;
    }
    return {
      MessageType: {
        REQUEST: 'request',
        RESPONSE: 'response',
        NOTIFICATION: 'notification',
        ERROR: 'error',
      },
      ProtocolType: {
        WEBSOCKET: 'websocket',
        HTTP: 'http',
        GRPC: 'grpc',
        MCP: 'mcp',
      },
    };
  },

  /**
   * Get platform authentication types
   */
  getAuthTypes: () => {
    if (platformTypes && platformTypes.AuthTypes) {
      return platformTypes.AuthTypes;
    }
    return {
      AuthMethod: {
        JWT: 'jwt',
        API_KEY: 'api_key',
        OAUTH: 'oauth',
        BASIC: 'basic',
      },
    };
  },

  /**
   * Map MCP error to platform error format
   */
  mapError: (mcpError: any) => {
    if (platformTypes && platformTypes.ErrorTypes) {
      return {
        code: mcpError.code,
        message: mcpError.message,
        type: 'MCP_ERROR',
        source: 'mcp-core',
        timestamp: new Date().toISOString(),
        data: mcpError.data,
        retryable: mcpError.retryable || false,
      };
    }
    return mcpError;
  },

  /**
   * Create platform-compatible event
   */
  createEvent: (eventType: string, data: any) => {
    if (platformTypes && platformTypes.EventTypes) {
      return {
        id: `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: `mcp.${eventType}`,
        source: 'mcp-core',
        timestamp: new Date().toISOString(),
        data,
        version: '1.0',
      };
    }
    return { type: eventType, data };
  },
};

/**
 * Type definitions that extend platform types or provide fallbacks
 */
export interface MCPPlatformMessage {
  id: string;
  type: 'mcp.request' | 'mcp.response' | 'mcp.notification' | 'mcp.error';
  source: string;
  target?: string;
  timestamp: string;
  data: any;
  metadata?: {
    correlationId?: string;
    retryAttempt?: number;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };
}

export interface MCPPlatformAgent {
  id: string;
  name: string;
  version: string;
  type: 'mcp-service' | 'agent' | 'tool' | 'resource-provider';
  capabilities: string[];
  metadata: {
    mcpEndpoint?: string;
    mcpResources?: any[];
    mcpTools?: any[];
    mcpStatus?: string;
    healthScore?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface MCPPlatformEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: any;
  version: string;
  metadata?: {
    correlationId?: string;
    causedBy?: string;
    affectedResources?: string[];
  };
}

/**
 * Configuration for platform integration
 */
export const DEFAULT_PLATFORM_CONFIG: PlatformIntegrationConfig = {
  enableSharedTypes: true,
  enableCommunicationBridge: true,
  enableDatabaseIntegration: true,
  enableRelayCore: true,
};

/**
 * Platform integration utilities
 */
export const PlatformUtils = {
  /**
   * Check if running in platform environment
   */
  isPlatformEnvironment: () => {
    return !!(
      platformTypes ||
      process.env.NEW_FUSE_PLATFORM === 'true' ||
      process.env.NODE_ENV === 'production'
    );
  },

  /**
   * Get platform configuration
   */
  getPlatformConfig: (): Partial<PlatformIntegrationConfig> => {
    const config: Partial<PlatformIntegrationConfig> = {};

    if (process.env.MCP_ENABLE_SHARED_TYPES !== undefined) {
      config.enableSharedTypes = process.env.MCP_ENABLE_SHARED_TYPES === 'true';
    }

    if (process.env.MCP_ENABLE_COMMUNICATION_BRIDGE !== undefined) {
      config.enableCommunicationBridge = process.env.MCP_ENABLE_COMMUNICATION_BRIDGE === 'true';
    }

    if (process.env.MCP_ENABLE_DATABASE_INTEGRATION !== undefined) {
      config.enableDatabaseIntegration = process.env.MCP_ENABLE_DATABASE_INTEGRATION === 'true';
    }

    if (process.env.MCP_ENABLE_RELAY_CORE !== undefined) {
      config.enableRelayCore = process.env.MCP_ENABLE_RELAY_CORE === 'true';
    }

    return config;
  },

  /**
   * Validate platform compatibility
   */
  validateCompatibility: () => {
    const issues: string[] = [];

    if (platformTypes) {
      // Check for required types
      if (!platformTypes.AgentTypes) {
        issues.push('Platform types missing AgentTypes');
      }

      if (!platformTypes.CommunicationTypes) {
        issues.push('Platform types missing CommunicationTypes');
      }

      // Check version compatibility
      const platformVersion = platformTypes.version || '1.0.0';
      const requiredVersion = '1.0.0';

      if (platformVersion < requiredVersion) {
        issues.push(`Platform types version ${platformVersion} < required ${requiredVersion}`);
      }
    }

    return {
      compatible: issues.length === 0,
      issues,
    };
  },
};

export default PlatformTypesBridge;
