import { EventEmitter } from 'events';
export interface PortRegistration {
    id: string;
    port: number;
    serviceName: string;
    serviceType: 'frontend' | 'api' | 'backend' | 'broker' | 'database' | 'other';
    environment: 'development' | 'staging' | 'production' | 'test';
    status: 'active' | 'reserved' | 'conflict' | 'inactive';
    processId?: number;
    host: string;
    protocol: 'http' | 'https' | 'ws' | 'wss' | 'tcp' | 'udp';
    healthCheckUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    reservedUntil?: Date;
    metadata: Record<string, any>;
}
export interface PortConflict {
    port: number;
    conflictingServices: PortRegistration[];
    suggestedResolutions: PortResolution[];
}
export interface PortResolution {
    type: 'reassign' | 'terminate' | 'merge';
    targetService: string;
    newPort?: number;
    description: string;
}
export interface ServiceConfiguration {
    serviceName: string;
    environment: string;
    preferredPort?: number;
    fallbackPorts: number[];
    autoAssign: boolean;
    portRangeMin: number;
    portRangeMax: number;
    healthCheck?: {
        path: string;
        interval: number;
        timeout: number;
    };
}
export interface RuntimePortCatalogEntry {
    port: number;
    serviceName: string;
    protected: boolean;
}
export interface RuntimePortProcess {
    pid: number;
    command: string;
}
export interface RuntimePortInspection extends RuntimePortCatalogEntry {
    status: 'clear' | 'occupied';
    processes: RuntimePortProcess[];
}
export interface RuntimePortPreflightResult {
    ok: boolean;
    blocked: RuntimePortInspection[];
    allowedOccupiedPorts: number[];
}
export declare class PortRegistryService extends EventEmitter {
    private redisClient;
    private registry;
    private configurations;
    private monitoringInterval;
    private temporaryReservations;
    constructor();
    /**
     * Register a port for a service
     */
    registerPort(config: {
        serviceName: string;
        serviceType: PortRegistration['serviceType'];
        environment: PortRegistration['environment'];
        port?: number;
        host?: string;
        protocol?: PortRegistration['protocol'];
        healthCheckUrl?: string;
        metadata?: Record<string, any>;
    }): Promise<PortRegistration>;
    private releaseTemporaryReservation;
    /**
     * Find an available port for a service
     */
    findAvailablePort(serviceName: string, environment: PortRegistration['environment']): Promise<number>;
    /**
     * Check if a port is available
     */
    isPortAvailable(port: number, host?: string): Promise<boolean>;
    /**
     * Detect port conflicts
     */
    detectConflicts(): Promise<PortConflict[]>;
    getRuntimePortCatalog(extraPorts?: RuntimePortCatalogEntry[]): RuntimePortCatalogEntry[];
    inspectRuntimePorts(extraPorts?: RuntimePortCatalogEntry[]): RuntimePortInspection[];
    detectRuntimeConflicts(options?: {
        includeProtected?: boolean;
        allowOccupiedPorts?: number[];
        extraPorts?: RuntimePortCatalogEntry[];
    }): RuntimePortPreflightResult;
    /**
     * Reassign a port
     */
    reassignPort(serviceId: string, newPort: number): Promise<void>;
    /**
     * Get service configuration
     */
    private getServiceConfiguration;
    /**
     * Load service configurations
     */
    private loadConfigurations;
    getAllRegistrations(): PortRegistration[];
    findByPort(port: number): PortRegistration | undefined;
    private findProcessesOnPort;
    private findPidsWithLsof;
    private findPidsWithSs;
    private getPidCommand;
    /**
     * Temporarily binds to a port to reserve it. Keeps the server open.
     * Returns the server instance if the port was successfully reserved, null otherwise.
     */
    /**
     * Temporarily binds to a port to reserve it. Keeps the server open.
     * Assumes a lock for this port has already been acquired if this is called after findAvailablePort.
     * Returns the server instance if the port was successfully reserved, null otherwise.
     */
    private reservePortTemporarily;
    getByService(serviceName: string, environment?: string): PortRegistration[];
    private acquirePortLock;
    private releasePortLock;
    destroy(): void;
}
//# sourceMappingURL=port-registry.service.d.ts.map