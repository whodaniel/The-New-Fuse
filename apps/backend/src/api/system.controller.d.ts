interface ServiceStatus {
    name: string;
    status: 'running' | 'stopped' | 'error';
    port?: number;
    type: string;
    health: 'healthy' | 'warning' | 'error';
    uptime?: number;
}
interface SystemMetrics {
    uptime: number;
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    cpu: {
        usage: number;
    };
    platform: string;
    version: string;
}
interface SystemTool {
    name: string;
    type: string;
    status: 'active' | 'inactive' | 'error';
    version?: string;
}
export declare class SystemController {
    getServicesStatus(): Promise<ServiceStatus[]>;
    getSystemMetrics(): Promise<SystemMetrics>;
    getSystemTools(): Promise<SystemTool[]>;
    private checkPortStatus;
    private checkDockerContainer;
}
export {};
//# sourceMappingURL=system.controller.d.ts.map