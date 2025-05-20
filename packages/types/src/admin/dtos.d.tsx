import { Permission } from './permissions.js';
export interface UpdateRolePermissionsDto {
    roleId: string;
    permissions: Permission[];
}
export interface SystemMetricsResponse {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    uptime: number;
    lastUpdated: Date;
}
export interface AuditLogResponse {
    id: string;
    timestamp: Date;
    type: 'user' | 'system' | 'security';
    action: string;
    details: Record<string, unknown>;
    userId?: string;
    metadata?: Record<string, unknown>;
}
export interface ServiceStatusResponse {
    id: string;
    name: string;
    status: string;
    uptime: number;
    lastError?: string;
    metrics: {
        requestCount: number;
        errorRate: number;
        avgResponseTime: number;
    };
}
//# sourceMappingURL=dtos.d.ts.map