import { 
  MCPRequest, 
  MCPResponse
} from './IMCPMessage.js';
import {
  MCPServiceInfo,
  ServiceQuery,
  ServiceHealth,
  AdvancedServiceQuery,
  ServiceCompatibilityResult,
  ServiceRecommendationOptions
} from '../types/index.js';

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
   * Advanced service discovery with capability matching and filtering
   * @param query Advanced query parameters with capability matching
   * @returns Promise resolving to array of matching services
   */
  discoverServicesAdvanced(query: AdvancedServiceQuery): Promise<MCPServiceInfo[]>;

  /**
   * Find services compatible with a given service
   * @param serviceId The ID of the service to find compatible services for
   * @returns Promise resolving to array of compatible services
   */
  findCompatibleServices(serviceId: string): Promise<MCPServiceInfo[]>;

  /**
   * Check capability compatibility between two services
   * @param serviceIdA The ID of the first service
   * @param serviceIdB The ID of the second service
   * @returns Promise resolving to compatibility analysis
   */
  checkServiceCompatibility(serviceIdA: string, serviceIdB: string): Promise<ServiceCompatibilityResult>;

  /**
   * Get service recommendations based on usage patterns and compatibility
   * @param serviceId The ID of the service to get recommendations for
   * @param options Recommendation options
   * @returns Promise resolving to array of recommended services
   */
  getServiceRecommendations(serviceId: string, options?: ServiceRecommendationOptions): Promise<MCPServiceInfo[]>;

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