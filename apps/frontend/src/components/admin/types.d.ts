export interface SystemHealth {
    cpuUsage: number;
    memoryUsage: number;
    diskSpace: number;
    uptime: number;
    activeAgents: number;
}
export interface NetworkStatus {
    latency: number;
    activeConnections: number;
    bandwidth: {
        upload: number;
        download: number;
    };
    errors: string[];
}
export interface AdminPanelProps {
    initialSystemHealth?: SystemHealth;
    initialNetworkStatus?: NetworkStatus;
    refreshInterval?: {
        health: number;
        network: number;
    };
}
export type AdminTabType = 'overview' | 'agents' | 'system';
