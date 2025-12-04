interface PortRegistration {
    id: string;
    port: number;
    serviceName: string;
    serviceType: 'frontend' | 'api' | 'backend' | 'broker' | 'database' | 'other';
    environment: string;
    status: 'active' | 'reserved' | 'conflict' | 'inactive';
    processId?: number;
    host: string;
    protocol: string;
    healthCheckUrl?: string;
    createdAt: string;
    updatedAt: string;
    metadata: Record<string, any>;
}
interface PortConflict {
    port: number;
    conflictingServices: PortRegistration[];
    suggestedResolutions: {
        type: 'reassign' | 'terminate' | 'merge';
        targetService: string;
        newPort?: number;
        description: string;
    }[];
}
declare class PortManagementApi {
    private wsConnection;
    getAllPorts(environment?: string): Promise<PortRegistration[]>;
    registerPort(config: {
        serviceName: string;
        serviceType: PortRegistration['serviceType'];
        environment: string;
        port?: number;
        host?: string;
        protocol?: string;
        healthCheckUrl?: string;
        metadata?: Record<string, any>;
    }): Promise<PortRegistration>;
    reassignPort(portId: string, newPort: number): Promise<void>;
    getConflicts(): Promise<PortConflict[]>;
    resolveConflict(resolution: {
        port: number;
        resolution: any;
    }): Promise<void>;
    findAvailablePort(serviceName: string, environment: string): Promise<number>;
    checkPortHealth(port: number): Promise<any>;
    connectWebSocket(): WebSocket;
    disconnectWebSocket(): void;
}
export declare const portManagementApi: PortManagementApi;
export {};
