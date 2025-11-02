export interface HealthCheck {
    id: string;
    name: string;
    type: 'http' | 'tcp' | 'custom';
    target?: string;
    interval?: number;
    timeout?: number;
    lastCheck?: Date;
    status?: 'up' | 'down' | 'degraded';
    check?: () => Promise<{ status: 'up' | 'down' | 'degraded' }>;
}
