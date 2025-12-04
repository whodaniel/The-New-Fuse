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
export declare const usePortRegistry: () => {
    ports: PortRegistration[];
    conflicts: PortConflict[];
    loading: boolean;
    error: string | null;
    refreshPorts: () => Promise<void>;
    registerPort: (config: {
        serviceName: string;
        serviceType: PortRegistration["serviceType"];
        environment: string;
        port?: number;
        host?: string;
        protocol?: string;
        healthCheckUrl?: string;
        metadata?: Record<string, any>;
    }) => Promise<PortRegistration>;
    reassignPort: (portId: string, newPort: number) => Promise<void>;
    resolveConflict: (port: number, resolution: any) => Promise<void>;
    findAvailablePort: (serviceName: string, environment: string) => Promise<number>;
    checkPortHealth: (port: number) => Promise<any>;
};
export {};
