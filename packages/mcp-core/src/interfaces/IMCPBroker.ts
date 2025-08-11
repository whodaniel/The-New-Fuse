import { 
  MCPRequest, 
  MCPResponse
} from './IMCPMessage';
import {
  MCPServiceInfo,
  ServiceQuery,
  ServiceHealth
} from '../types';

/**
 * Core MCP Broker interface that defines the contract for MCP broker implementations.
 * Provides service registry, discovery, and message routing capabilities for
 * managing multiple MCP services in a distributed system.
 */
export interface IMCPBroker {
  /**
   * Register a service with the broker
   * @param service The service information to register
   */
  registerService(service: MCPServiceInfo): Promise<void>;

  /**
   * Unregister a service from the broker
   * @param serviceId The ID of the service to unregister
   */
  unregisterService(serviceId: string): Promise<void>;

  /**
   * Discover services based on query criteria
   * @param query Query parameters for service discovery
   * @returns Promise resolving to array of matching services
   */
  discoverServices(query: ServiceQuery): Promise<MCPServiceInfo[]>;

  /**
   * Route a request to an appropriate service
   * @param request The MCP request to route
   * @param targetService Optional specific service ID to target
   * @returns Promise resolving to MCP response
   */
  routeRequest(request: MCPRequest, targetService?: string): Promise<MCPResponse>;

  /**
   * Get health status of a specific service
   * @param serviceId The ID of the service to check
   * @returns Promise resolving to service health information
   */
  getServiceHealth(serviceId: string): Promise<ServiceHealth>;

  /**
   * Get all registered services
   * @returns Promise resolving to array of all registered services
   */
  getAllServices(): Promise<MCPServiceInfo[]>;

  /**
   * Update service information
   * @param serviceId The ID of the service to update
   * @param updates Partial service information to update
   */
  updateService(serviceId: string, updates: Partial<MCPServiceInfo>): Promise<void>;

  /**
   * Check if a service is registered
   * @param serviceId The ID of the service to check
   * @returns True if service is registered, false otherwise
   */
  isServiceRegistered(serviceId: string): Promise<boolean>;

  /**
   * Start the broker service
   */
  start(): Promise<void>;

  /**
   * Stop the broker service
   */
  stop(): Promise<void>;

  /**
   * Check if the broker is running
   * @returns True if broker is running, false otherwise
   */
  isRunning(): boolean;
}