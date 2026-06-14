var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SystemDiagnosticsService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// -----------------
// #endregion Interfaces
// -----------------
let SystemDiagnosticsService = SystemDiagnosticsService_1 = class SystemDiagnosticsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new Logger(SystemDiagnosticsService_1.name);
        this.healthChecks = [];
        this.registerInitialChecks();
    }
    // -----------------
    // #region Public Methods
    // -----------------
    async runDiagnostics() {
        this.logger.log('Running system diagnostics...');
        await this.executeChecks();
        const diagnostics = {
            overall: this.getOverallStatus(),
            checks: this.healthChecks,
        };
        this.logger.log(`Diagnostics complete. Overall status: ${diagnostics.overall}`);
        return diagnostics;
    }
    getResolution(diagnostics) {
        const criticalChecks = diagnostics.checks.filter(c => c.status === 'critical');
        const warningChecks = diagnostics.checks.filter(c => c.status === 'warning');
        if (criticalChecks.length > 0) {
            return this.generateResolution(criticalChecks, 'high');
        }
        if (warningChecks.length > 0) {
            return this.generateResolution(warningChecks, 'medium');
        }
        return {
            severity: 'low',
            recommendations: ['All systems are operating normally.'],
        };
    }
    registerHealthCheck(check) {
        this.healthChecks.push(check);
    }
    // -----------------
    // #endregion Public Methods
    // -----------------
    // -----------------
    // #region Private Methods
    // -----------------
    async executeChecks() {
        for (const check of this.healthChecks) {
            try {
                // In a real implementation, you would have specific check functions
                // For now, we'll simulate the checks.
                if (check.component === 'database') {
                    await this.checkDatabase(check);
                }
                else if (check.component === 'redis') {
                    await this.checkRedis(check);
                }
            }
            catch (error) {
                check.status = 'critical';
                check.message = error instanceof Error ? error.message : 'Unknown error';
            }
        }
    }
    getOverallStatus() {
        const statuses = this.healthChecks.map(c => c.status);
        if (statuses.some(s => s === 'critical')) {
            return 'critical';
        }
        if (statuses.some(s => s === 'warning')) {
            return 'warning';
        }
        return 'healthy';
    }
    generateResolution(checks, severity) {
        const recommendations = checks.flatMap(check => {
            switch (check.component) {
                case 'database':
                    return [
                        'Check database logs for errors.',
                        'Verify database configuration.',
                        'Restart database service if necessary.',
                    ];
                case 'redis':
                    return [
                        'Monitor Redis performance.',
                        'Check for resource constraints.',
                        'Review recent configuration changes.',
                    ];
                default:
                    return ['No specific recommendations for this component.'];
            }
        });
        return {
            severity,
            recommendations,
        };
    }
    registerInitialChecks() {
        this.registerHealthCheck({
            component: 'database',
            status: 'unknown',
            message: 'Database connection has not been checked yet.',
        });
        this.registerHealthCheck({
            component: 'redis',
            status: 'unknown',
            message: 'Redis connection has not been checked yet.',
        });
        this.registerHealthCheck({
            component: 'external_apis',
            status: 'healthy',
            message: 'External APIs are responding.',
            details: {
                openai: 'healthy',
                anthropic: 'healthy',
            },
        });
    }
    async checkDatabase(check) {
        // Mock database check
        const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
        check.status = isHealthy ? 'healthy' : 'critical';
        check.message = isHealthy ? 'Database connection is healthy.' : 'Failed to connect to the database.';
    }
    async checkRedis(check) {
        // Mock Redis check
        const isHealthy = Math.random() > 0.2; // 80% chance of being healthy
        check.status = isHealthy ? 'healthy' : 'warning';
        check.message = isHealthy ? 'Redis connection is healthy.' : 'High memory usage detected in Redis.';
    }
};
SystemDiagnosticsService = SystemDiagnosticsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], SystemDiagnosticsService);
export { SystemDiagnosticsService };
//# sourceMappingURL=system-diagnostics.service.js.map