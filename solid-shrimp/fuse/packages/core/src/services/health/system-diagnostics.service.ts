
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// -----------------
// #region Interfaces
// -----------------

interface HealthCheck {
    component: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    message: string;
    details?: Record<string, any>;
}

interface Diagnostics {
    overall: 'healthy' | 'warning' | 'critical';
    checks: HealthCheck[];
}

interface Resolution {
    severity: 'low' | 'medium' | 'high';
    recommendations: string[];
}

// -----------------
// #endregion Interfaces
// -----------------

@Injectable()
export class SystemDiagnosticsService {
    private readonly logger = new Logger(SystemDiagnosticsService.name);
    private healthChecks: HealthCheck[] = [];

    constructor(private configService: ConfigService) {
        this.registerInitialChecks();
    }

    // -----------------
    // #region Public Methods
    // -----------------

    public async runDiagnostics(): Promise<Diagnostics> {
        this.logger.log('Running system diagnostics...');
        await this.executeChecks();

        const diagnostics: Diagnostics = {
            overall: this.getOverallStatus(),
            checks: this.healthChecks,
        };

        this.logger.log(`Diagnostics complete. Overall status: ${diagnostics.overall}`);
        return diagnostics;
    }

    public getResolution(diagnostics: Diagnostics): Resolution {
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

    public registerHealthCheck(check: HealthCheck): void {
        this.healthChecks.push(check);
    }

    // -----------------
    // #endregion Public Methods
    // -----------------

    // -----------------
    // #region Private Methods
    // -----------------

    private async executeChecks(): Promise<void> {
        for (const check of this.healthChecks) {
            try {
                // In a real implementation, you would have specific check functions
                // For now, we'll simulate the checks.
                if (check.component === 'database') {
                    await this.checkDatabase(check);
                } else if (check.component === 'redis') {
                    await this.checkRedis(check);
                }
            } catch (error) {
                check.status = 'critical';
                check.message = error instanceof Error ? error.message : 'Unknown error';
            }
        }
    }

    private getOverallStatus(): Diagnostics['overall'] {
        const statuses = this.healthChecks.map(c => c.status);

        if (statuses.some(s => s === 'critical')) {
            return 'critical';
        }
        if (statuses.some(s => s === 'warning')) {
            return 'warning';
        }
        return 'healthy';
    }

    private generateResolution(checks: HealthCheck[], severity: 'low' | 'medium' | 'high'): Resolution {
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

    private registerInitialChecks(): void {
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

    private async checkDatabase(check: HealthCheck): Promise<void> {
        // Mock database check
        const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
        check.status = isHealthy ? 'healthy' : 'critical';
        check.message = isHealthy ? 'Database connection is healthy.' : 'Failed to connect to the database.';
    }

    private async checkRedis(check: HealthCheck): Promise<void> {
        // Mock Redis check
        const isHealthy = Math.random() > 0.2; // 80% chance of being healthy
        check.status = isHealthy ? 'healthy' : 'warning';
        check.message = isHealthy ? 'Redis connection is healthy.' : 'High memory usage detected in Redis.';
    }

    // -----------------
    // #endregion Private Methods
    // -----------------
}
