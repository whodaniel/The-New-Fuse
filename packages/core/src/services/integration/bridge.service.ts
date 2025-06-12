import { Injectable } from '@nestjs/common';
import { ConfigService  } from '@nestjs/config;

export interface ServiceEndpoint {
  serviceName: string;
  endpoint: string;
  capabilities: string[]';
  protocol: string';
  status:active' | inactive' | error';
  lastHealthCheck?: Date;
}

export interface ServiceConnection {
  id: string;
  sourceService: string;
  targetService: string;
  protocol: string;
  status:connected' | disconnected' | error';
  lastActivity?: Date;
}

@Injectable()
export class BridgeService {
  private serviceEndpoints: Map<string, ServiceEndpoint> = new Map();
  private serviceConnections: Map<string, ServiceConnection> = new Map();

  constructor(
    private readonly configService: ConfigService
  ) {}

  public async connectServices(
    sourceService: string, 
    targetService: string, 
    protocol: string
  ): Promise<ServiceConnection> {
    const connectionId = `${sourceService}-${targetService}-${protocol}`;
    
    // Validate source and target services exist
    const sourceEndpoint = this.serviceEndpoints.get(sourceService);
    const targetEndpoint = this.serviceEndpoints.get(targetService);
    
    if (!sourceEndpoint) {
      throw new Error(`Source service not found: ${sourceService}`);
    }
    
    if (!targetEndpoint) {
      throw new Error(`Target service not found: ${targetService}`);
    }

    // Create connection
    const connection: ServiceConnection = {
      id: connectionId,
      sourceService,
      targetService,
      protocol,
      status: 'connected',
      lastActivity: new Date()
    };

    this.serviceConnections.set(connectionId, connection);
    
    // Log connection establishment
    console.log(`Established bridge connection: ${sourceService} -> ${targetService} (${protocol})`);
    
    return connection;
  }

  public async registerServiceEndpoint(
    serviceName: string, 
    endpoint: string, 
    capabilities: string[]
  ): Promise<ServiceEndpoint> {
    const serviceEndpoint: ServiceEndpoint = {
      serviceName,
      endpoint,
      capabilities,
      protocol: this.detectProtocol(endpoint),
      status: 'active',
      lastHealthCheck: new Date()
    };

    this.serviceEndpoints.set(serviceName, serviceEndpoint);
    
    console.log(`Registered service endpoint: ${serviceName} at ${endpoint}`);
    
    return serviceEndpoint;
  }

  public async unregisterServiceEndpoint(serviceName: string): Promise<void> {
    const endpoint = this.serviceEndpoints.get(serviceName);
    if (!endpoint) {
      throw new Error(`Service endpoint not found: ${serviceName}`);
    }

    // Remove all connections involving this service
    const connectionsToRemove = Array.from(this.serviceConnections.values())
      .filter(conn => conn.sourceService === serviceName || conn.targetService === serviceName);
    
    for (const conn of connectionsToRemove) {
      this.serviceConnections.delete(conn.id);
    }

    this.serviceEndpoints.delete(serviceName);
    console.log(`Unregistered service endpoint: ${serviceName}`);
  }

  public async disconnectServices(
    sourceService: string, 
    targetService: string, 
    protocol?: string
  ): Promise<void> {
    const connectionId = protocol 
      ? `${sourceService}-${targetService}-${protocol}`
      : null;

    if (connectionId) {
      const connection = this.serviceConnections.get(connectionId);
      if (connection) {
        connection.status = 'disconnected';
        this.serviceConnections.delete(connectionId);
        console.log(`Disconnected bridge: ${sourceService} -> ${targetService} (${protocol})`);
      }
    } else {
      // Disconnect all connections between these services
      const connectionsToRemove = Array.from(this.serviceConnections.values())
        .filter(conn => 
          conn.sourceService === sourceService && conn.targetService === targetService
        );
      
      for (const conn of connectionsToRemove) {
        this.serviceConnections.delete(conn.id);
        console.log(`Disconnected bridge: ${sourceService} -> ${targetService} (${conn.protocol})`);
      }
    }
  }

  public getServiceEndpoint(serviceName: string): ServiceEndpoint | undefined {
    return this.serviceEndpoints.get(serviceName);
  }

  public getAllServiceEndpoints(): ServiceEndpoint[] {
    return Array.from(this.serviceEndpoints.values());
  }

  public getServiceConnection(connectionId: string): ServiceConnection | undefined {
    return this.serviceConnections.get(connectionId);
  }

  public getAllServiceConnections(): ServiceConnection[] {
    return Array.from(this.serviceConnections.values());
  }

  public async healthCheckService(serviceName: string): Promise<boolean> {
    const endpoint = this.serviceEndpoints.get(serviceName);
    if (!endpoint) {
      return false;
    }

    try {
      // Perform health check based on protocol
      const isHealthy = await this.performHealthCheck(endpoint);
      
      endpoint.status = isHealthy ? 'active' :'error';
      endpoint.lastHealthCheck = new Date();
      
      return isHealthy;
    } catch {
      endpoint.status = 'error';
      endpoint.lastHealthCheck = new Date();
      return false;
    }
  }

  public async routeMessage(
    sourceService: string,
    targetService: string,
    message: any,
    protocol?: string
  ): Promise<any> {
    // Find appropriate connection
    const connections = Array.from(this.serviceConnections.values())
      .filter(conn => 
        conn.sourceService === sourceService && 
        conn.targetService === targetService &&
        conn.status === connected' &&
        (!protocol || conn.protocol === protocol)
      );

    if (connections.length === 0) {
      throw new Error(`No active connection found from ${sourceService} to ${targetService}`);
    }

    const connection = connections[0]; // Use first available connection
    
    // Update last activity
    connection.lastActivity = new Date();
    
    // Route message (placeholder implementation)
    console.log(`Routing message from ${sourceService} to ${targetService} via ${connection.protocol}:`, message);
    
    // In a real implementation, this would:
    // 1. Transform message format based on protocol
    // 2. Handle authentication/authorization
    // 3. Apply rate limiting
    // 4. Log the interaction
    // 5. Forward to target service
    
    return { success: true, connectionId: connection.id, message };
  }

  private detectProtocol(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return http';
    } else if (endpoint.startsWith('ws://') || endpoint.startsWith('wss://')) {
      return websocket';
    } else if (endpoint.startsWith('tcp://')) {
      return tcp';
    } else if (endpoint.includes(':')) {
      return tcp'; // Assume TCP for host:port format
    }
    return unknown';
  }

  private async performHealthCheck(endpoint: ServiceEndpoint): Promise<boolean> {
    // Placeholder health check implementation
    // In a real implementation, this would make actual requests to the service
    switch (endpoint.protocol) {
      case http':
        // HTTP health check
        return true; // Placeholder
      case websocket':
        // WebSocket health check
        return true; // Placeholder
      case tcp':
        // TCP health check
        return true; // Placeholder
      default:
        return false;
    }
  }
}