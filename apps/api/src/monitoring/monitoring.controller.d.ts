import { WalletMonitoringService, SystemHealth, SecurityAlert } from './wallet-monitoring.service';
export declare class MonitoringController {
    private readonly monitoringService;
    constructor(monitoringService: WalletMonitoringService);
    getSystemHealth(): Promise<{
        health: SystemHealth;
        recentAlerts: SecurityAlert[];
        alertStats: {
            total: number;
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
    }>;
    getRecentAlerts(): SecurityAlert[];
    createAlert(alertData: {
        type: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        metadata?: any;
    }): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=monitoring.controller.d.ts.map