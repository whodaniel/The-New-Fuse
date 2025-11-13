/**
 * MCP Broker Implementation
 *
 * This module implements the core MCP broker functionality including service registry,
 * discovery, health monitoring, and automatic cleanup capabilities.
 */
import { EventEmitter } from 'events';
import { IMCPBroker } from '../interfaces/IMCPBroker';
import { MCPRequest, MCPResponse, MCPNotification } from '../interfaces/IMCPMessage';
import { MCPServiceInfo, ServiceQuery, ServiceHealth, BrokerConfig, RoutingMetrics, ServiceCompatibilityResult } from '../types';
import { PatternType } from './EventSubscriptionManager';
/**
 * MCPBroker class implementing the IMCPBroker interface
 *
 * Provides comprehensive service registry, discovery, health monitoring,
 * and message routing capabilities for MCP services.
 */
export declare class MCPBroker extends EventEmitter implements IMCPBroker {
    private config;
    private serviceRegistry;
    private healthMonitor;
    private messageRouter;
    private loadBalancer;
    private eventSubscriptionManager;
    private isRunningFlag;
    private cleanupInterval?;
    private metricsInterval?;
    private startTime;
    constructor(config?: Partial<BrokerConfig>);
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
     */
    isRunning(): boolean;
    /**
     * Register a service with the broker
     */
    registerService(service: MCPServiceInfo): Promise<void>;
    /**
     * Unregister a service from the broker
     */
    unregisterService(serviceId: string): Promise<void>;
    /**
     * Discover services based on query criteria
     */
    discoverServices(query: ServiceQuery): Promise<MCPServiceInfo[]>;
    /**
     * Advanced service discovery with capability matching
     */
    discoverServicesAdvanced(query: ServiceQuery & {
        requiredCapabilities?: string[];
        compatibleWith?: string;
        minHealthScore?: number;
        maxAge?: number;
    }): Promise<MCPServiceInfo[]>;
    /**
     * Find services compatible with a given service
     */
    findCompatibleServices(serviceId: string): Promise<MCPServiceInfo[]>;
    /**
     * Get service recommendations
     */
    getServiceRecommendations(serviceId: string, options?: {
        maxRecommendations?: number;
        includeCompatible?: boolean;
        includeSimilar?: boolean;
        weightByHealth?: boolean;
    }): Promise<MCPServiceInfo[]>;
    /**
     * Check capability compatibility between two services
     */
    checkServiceCompatibility(serviceIdA: string, serviceIdB: string): Promise<ServiceCompatibilityResult>;
    /**
     * Route a request to an appropriate service
     */
    routeRequest(request: MCPRequest, targetService?: string): Promise<MCPResponse>;
    /**
     * Get health status of a specific service
     */
    getServiceHealth(serviceId: string): Promise<ServiceHealth>;
    /**
     * Get all registered services
     */
    getAllServices(): Promise<MCPServiceInfo[]>;
    /**
     * Update service information
     */
    updateService(serviceId: string, updates: Partial<MCPServiceInfo>): Promise<void>;
    /**
     * Check if a service is registered
     */
    isServiceRegistered(serviceId: string): Promise<boolean>;
    /**
     * Get broker metrics
     */
    getMetrics(): RoutingMetrics;
    /**
     * Get broker configuration
     */
    getConfig(): BrokerConfig;
    /**
     * Get broker uptime in milliseconds
     */
    getUptime(): number;
    /**
     * Subscribe a service to events matching a pattern
     */
    subscribeToEvents(serviceId: string, pattern: string, patternType?: PatternType, filters?: Record<string, any>, metadata?: Record<string, any>): Promise<string>;
    /**
     * Unsubscribe from events
     */
    unsubscribeFromEvents(subscriptionId: string): Promise<void>;
    /**
     * Route notification to subscribed services
     */
    routeNotification(notification: MCPNotification): Promise<void>;
    /**
     * Get event subscription statistics
     */
    getEventSubscriptionStatistics(): import("./EventSubscriptionManager").SubscriptionStats;
    /**
     * Merge user config with default config
     */
    private mergeConfig;
    /**
     * Validate service information
     */
    private validateServiceInfo;
    /**
     * Setup event handlers for internal components
     */
    private setupEventHandlers;
    /**
     * Start automatic cleanup task
     */
    private startCleanupTask;
    /**
     * Start metrics collection
     */
    private startMetricsCollection;
}
//# sourceMappingURL=MCPBroker.d.ts.map