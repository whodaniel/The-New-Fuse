import { PrismaService } from '../services/prisma.service';
export interface SecurityAlert {
    type: 'HIGH_RISK_TRANSACTION' | 'WEB3AUTH_FAILURE' | 'AGENT_ANOMALY' | 'BUNDLER_ERROR' | 'PAYMASTER_ERROR';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    metadata?: any;
    timestamp: Date;
}
export interface SystemHealth {
    web3authStatus: 'healthy' | 'degraded' | 'down';
    bundlerStatus: 'healthy' | 'degraded' | 'down';
    paymasterBalance: string;
    activeAgents: number;
    pendingTransactions: number;
    last24hTransactions: number;
    averageGasUsed: number;
}
export declare class WalletMonitoringService {
    private readonly prisma;
    private readonly logger;
    private alerts;
    constructor(prisma: PrismaService);
    createAlert(alert: Omit<SecurityAlert, 'timestamp'>): Promise<void>;
    monitorSystemHealth(): Promise<void>;
    monitorAgentActivity(): Promise<void>;
    monitorTransactionStatus(): Promise<void>;
    private getSystemHealth;
    private checkWeb3AuthHealth;
    private checkBundlerHealth;
    private getPaymasterBalance;
    private detectSuspiciousAgentActivity;
    private findStuckTransactions;
    private checkForAnomalies;
    private sendToMonitoringService;
    private handleCriticalAlert;
    private autoFundPaymaster;
    private switchToBackupWeb3Auth;
    getRecentAlerts(limit?: number): SecurityAlert[];
    getSystemMetrics(): Promise<{
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
}
//# sourceMappingURL=wallet-monitoring.service.d.ts.map