"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WalletMonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletMonitoringService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../services/prisma.service");
let WalletMonitoringService = WalletMonitoringService_1 = class WalletMonitoringService {
    prisma;
    logger = new common_1.Logger(WalletMonitoringService_1.name);
    alerts = [];
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAlert(alert) {
        const securityAlert = {
            ...alert,
            timestamp: new Date()
        };
        this.alerts.push(securityAlert);
        // Log structured alert
        this.logger.warn('Security Alert', {
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            metadata: alert.metadata
        });
        // Send to external monitoring service if configured
        await this.sendToMonitoringService(securityAlert);
        // Trigger immediate actions for critical alerts
        if (alert.severity === 'CRITICAL') {
            await this.handleCriticalAlert(securityAlert);
        }
    }
    async monitorSystemHealth() {
        try {
            const health = await this.getSystemHealth();
            this.logger.log('System Health Check', {
                web3authStatus: health.web3authStatus,
                bundlerStatus: health.bundlerStatus,
                paymasterBalance: health.paymasterBalance,
                activeAgents: health.activeAgents,
                pendingTransactions: health.pendingTransactions
            });
            // Check for anomalies
            await this.checkForAnomalies(health);
        }
        catch (error) {
            this.logger.error('Health check failed:', error);
            await this.createAlert({
                type: 'WEB3AUTH_FAILURE',
                severity: 'HIGH',
                message: 'System health check failed',
                metadata: { error: error.message }
            });
        }
    }
    async monitorAgentActivity() {
        try {
            // Check for unusual agent activity patterns
            const suspiciousAgents = await this.detectSuspiciousAgentActivity();
            for (const agent of suspiciousAgents) {
                await this.createAlert({
                    type: 'AGENT_ANOMALY',
                    severity: 'MEDIUM',
                    message: `Anomalous activity detected for agent ${agent.verifierId}`,
                    metadata: agent
                });
            }
        }
        catch (error) {
            this.logger.error('Agent activity monitoring failed:', error);
        }
    }
    async monitorTransactionStatus() {
        try {
            // Check for stuck transactions
            const stuckTransactions = await this.findStuckTransactions();
            if (stuckTransactions.length > 0) {
                await this.createAlert({
                    type: 'BUNDLER_ERROR',
                    severity: 'MEDIUM',
                    message: `${stuckTransactions.length} transactions stuck in pending state`,
                    metadata: { transactionIds: stuckTransactions.map(tx => tx.id) }
                });
            }
        }
        catch (error) {
            this.logger.error('Transaction monitoring failed:', error);
        }
    }
    async getSystemHealth() {
        // Get active agents count
        const activeAgents = await this.prisma.wallet.count({
            where: { wallet_type: 'SMART_ACCOUNT' }
        });
        // Get pending transactions
        const pendingTransactions = await this.prisma.transaction.count({
            where: { status: 'PENDING' }
        });
        // Get 24h transaction count
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const last24hTransactions = await this.prisma.transaction.count({
            where: {
                created_at: { gte: last24h }
            }
        });
        // Calculate average gas used
        const gasStats = await this.prisma.transaction.aggregate({
            where: {
                created_at: { gte: last24h },
                status: 'SUCCESS'
            },
            _avg: { value: true }
        });
        return {
            web3authStatus: await this.checkWeb3AuthHealth(),
            bundlerStatus: await this.checkBundlerHealth(),
            paymasterBalance: await this.getPaymasterBalance(),
            activeAgents,
            pendingTransactions,
            last24hTransactions,
            averageGasUsed: Number(gasStats._avg.value) || 0
        };
    }
    async checkWeb3AuthHealth() {
        try {
            // Check Web3Auth service responsiveness
            // This would ping Web3Auth endpoints or check recent connection success rates
            return 'healthy';
        }
        catch (error) {
            return 'down';
        }
    }
    async checkBundlerHealth() {
        try {
            // Check bundler service health
            const bundlerUrl = process.env.BUNDLER_URL;
            if (!bundlerUrl)
                return 'down';
            const response = await fetch(`${bundlerUrl}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_chainId',
                    params: []
                })
            });
            return response.ok ? 'healthy' : 'degraded';
        }
        catch (error) {
            return 'down';
        }
    }
    async getPaymasterBalance() {
        try {
            // Check paymaster balance on-chain
            // This would query the EntryPoint contract for the paymaster's deposit
            return '1.5'; // Placeholder
        }
        catch (error) {
            return '0';
        }
    }
    async detectSuspiciousAgentActivity() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        // Find agents with unusually high transaction volume
        const highVolumeAgents = await this.prisma.wallet.findMany({
            where: {
                wallet_type: 'SMART_ACCOUNT',
                transactions: {
                    some: {
                        created_at: { gte: oneHourAgo }
                    }
                }
            },
            include: {
                transactions: {
                    where: {
                        created_at: { gte: oneHourAgo }
                    }
                },
                user: true
            }
        });
        return highVolumeAgents.filter(agent => agent.transactions.length > 50 // More than 50 transactions per hour
        ).map(agent => ({
            verifierId: agent.user.verifierId,
            transactionCount: agent.transactions.length,
            totalValue: agent.transactions.reduce((sum, tx) => sum + Number(tx.value), 0)
        }));
    }
    async findStuckTransactions() {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        return this.prisma.transaction.findMany({
            where: {
                status: 'PENDING',
                created_at: { lt: fifteenMinutesAgo }
            }
        });
    }
    async checkForAnomalies(health) {
        // Check paymaster balance
        if (parseFloat(health.paymasterBalance) < 0.1) {
            await this.createAlert({
                type: 'PAYMASTER_ERROR',
                severity: 'CRITICAL',
                message: 'Paymaster balance critically low',
                metadata: { balance: health.paymasterBalance }
            });
        }
        // Check for too many pending transactions
        if (health.pendingTransactions > 100) {
            await this.createAlert({
                type: 'BUNDLER_ERROR',
                severity: 'HIGH',
                message: 'High number of pending transactions detected',
                metadata: { count: health.pendingTransactions }
            });
        }
        // Check service health
        if (health.web3authStatus === 'down') {
            await this.createAlert({
                type: 'WEB3AUTH_FAILURE',
                severity: 'CRITICAL',
                message: 'Web3Auth service is down'
            });
        }
        if (health.bundlerStatus === 'down') {
            await this.createAlert({
                type: 'BUNDLER_ERROR',
                severity: 'CRITICAL',
                message: 'Bundler service is down'
            });
        }
    }
    async sendToMonitoringService(alert) {
        try {
            // Send to DataDog, Prometheus, or other monitoring service
            const monitoringEndpoint = process.env.MONITORING_WEBHOOK_URL;
            if (!monitoringEndpoint)
                return;
            await fetch(monitoringEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: alert.timestamp.toISOString(),
                    service: 'tnf-wallet-platform',
                    alert_type: alert.type,
                    severity: alert.severity,
                    message: alert.message,
                    metadata: alert.metadata
                })
            });
        }
        catch (error) {
            this.logger.error('Failed to send alert to monitoring service:', error);
        }
    }
    async handleCriticalAlert(alert) {
        // Handle critical alerts immediately
        switch (alert.type) {
            case 'PAYMASTER_ERROR':
                // Auto-fund paymaster if configured
                await this.autoFundPaymaster();
                break;
            case 'WEB3AUTH_FAILURE':
                // Switch to backup Web3Auth instance if available
                await this.switchToBackupWeb3Auth();
                break;
            default:
                this.logger.error('Critical alert requiring manual intervention:', alert);
        }
    }
    async autoFundPaymaster() {
        try {
            // Auto-fund paymaster from treasury wallet if configured
            this.logger.log('Auto-funding paymaster triggered');
            // Implementation would fund the paymaster contract
        }
        catch (error) {
            this.logger.error('Auto-funding paymaster failed:', error);
        }
    }
    async switchToBackupWeb3Auth() {
        try {
            // Switch to backup Web3Auth configuration
            this.logger.log('Switching to backup Web3Auth instance');
            // Implementation would update Web3Auth configuration
        }
        catch (error) {
            this.logger.error('Failed to switch to backup Web3Auth:', error);
        }
    }
    getRecentAlerts(limit = 50) {
        return this.alerts
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    async getSystemMetrics() {
        const health = await this.getSystemHealth();
        const recentAlerts = this.getRecentAlerts(10);
        return {
            health,
            recentAlerts,
            alertStats: {
                total: this.alerts.length,
                critical: this.alerts.filter(a => a.severity === 'CRITICAL').length,
                high: this.alerts.filter(a => a.severity === 'HIGH').length,
                medium: this.alerts.filter(a => a.severity === 'MEDIUM').length,
                low: this.alerts.filter(a => a.severity === 'LOW').length
            }
        };
    }
};
exports.WalletMonitoringService = WalletMonitoringService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletMonitoringService.prototype, "monitorSystemHealth", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletMonitoringService.prototype, "monitorAgentActivity", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletMonitoringService.prototype, "monitorTransactionStatus", null);
exports.WalletMonitoringService = WalletMonitoringService = WalletMonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletMonitoringService);
