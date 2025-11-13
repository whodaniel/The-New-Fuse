/**
 * Service Registry Implementation
 *
 * Manages service registration, discovery, and lifecycle with support for
 * both in-memory and persistent storage backends.
 */
import { EventEmitter } from 'events';
import { MCPServiceInfo, ServiceQuery, RegistryConfig } from '../types';
import { ServiceStatus } from '../types/common';
/**
 * Service Registry class for managing MCP service registration and discovery
 */
export declare class ServiceRegistry extends EventEmitter {
    private services;
    private serviceTimers;
    private config;
    private isStarted;
    constructor(config: RegistryConfig);
    /**
     * Start the service registry
     */
    start(): Promise<void>;
    /**
     * Stop the service registry
     */
    stop(): Promise<void>;
    /**
     * Register a service
     */
    register(service: MCPServiceInfo): Promise<void>;
    /**
     * Unregister a service
     */
    unregister(serviceId: string): Promise<void>;
    /**
     * Get a service by ID
     */
    get(serviceId: string): Promise<MCPServiceInfo | null>;
    /**
     * Get all registered services
     */
    getAll(): Promise<MCPServiceInfo[]>;
    /**
     * Update a service
     */
    update(serviceId: string, service: MCPServiceInfo): Promise<void>;
    /**
     * Discover services based on query criteria
     */
    discover(query: ServiceQuery): Promise<MCPServiceInfo[]>;
    /**
     * Update service heartbeat
     */
    heartbeat(serviceId: string): Promise<void>;
    /**
     * Cleanup expired services
     */
    cleanup(): Promise<void>;
    /**
     * Get registry statistics
     */
    getStatistics(): {
        totalServices: number;
        statusCounts: Record<ServiceStatus, number>;
        oldestService: MCPServiceInfo | null;
        newestService: MCPServiceInfo | null;
    };
    /**
     * Reset service TTL timer
     */
    private resetServiceTimer;
    /**
     * Apply generic filter to services
     */
    private applyGenericFilter;
    /**
     * Apply sorting to services
     */
    private applySorting;
    /**
     * Check if a service has the required capabilities
     */
    hasCapabilities(service: MCPServiceInfo, requiredCapabilities: string[]): boolean;
    /**
     * Check capability compatibility between services
     */
    checkCapabilityCompatibility(serviceA: MCPServiceInfo, serviceB: MCPServiceInfo): {
        compatible: boolean;
        commonCapabilities: string[];
        missingInA: string[];
        missingInB: string[];
        compatibilityScore: number;
        analysis?: {
            resourceCompatibility: boolean;
            toolCompatibility: boolean;
            versionCompatibility: boolean;
        };
    };
    /**
     * Check version compatibility between two services
     */
    private checkVersionCompatibility;
    /**
     * Find services with compatible capabilities
     */
    findCompatibleServices(targetService: MCPServiceInfo): Promise<MCPServiceInfo[]>;
    /**
     * Advanced service discovery with capability matching
     */
    discoverWithCapabilityMatching(query: ServiceQuery & {
        requiredCapabilities?: string[];
        compatibleWith?: string;
        minHealthScore?: number;
        maxAge?: number;
        capabilityMatchMode?: 'all' | 'any' | 'exact';
        includePartialMatches?: boolean;
    }): Promise<MCPServiceInfo[]>;
    /**
     * Check if a service has exact capabilities (no more, no less)
     */
    private hasExactCapabilities;
    /**
     * Get service recommendations based on usage patterns and compatibility
     */
    getServiceRecommendations(currentService: MCPServiceInfo, options?: {
        maxRecommendations?: number;
        includeCompatible?: boolean;
        includeSimilar?: boolean;
        weightByHealth?: boolean;
        weightByUsage?: boolean;
        excludeTags?: string[];
        includeTags?: string[];
    }): Promise<MCPServiceInfo[]>;
}
//# sourceMappingURL=ServiceRegistry.d.ts.map