import { Controller, Get, Query } from '@nestjs/common';
import { A2AVersionManager } from '../services/A2AVersionManager.js';
import { A2ASchemaValidator } from '../services/A2ASchemaValidator.js';
import { A2AMonitoringIntegration } from '../services/A2AMonitoringIntegration.js';

@Controller('a2a/health')
export class A2AHealthController {
    constructor(
        private versionManager: A2AVersionManager,
        private schemaValidator: A2ASchemaValidator,
        private monitoring: A2AMonitoringIntegration
    ) {}

    @Get('compatibility')
    async checkCompatibility(@Query('version') version: string) {
        return {
            compatible: this.versionManager.isVersionCompatible(version),
            currentVersion: this.versionManager.getCurrentVersion(),
            supportedVersions: this.versionManager.getSupportedVersions()
        };
    }

    @Get('status')
    async getProtocolStatus() {
        const metrics = await this.monitoring.getProtocolMetrics();
        return {
            status: 'healthy',
            activeAgents: metrics.activeAgents,
            messageRate: metrics.messageRate,
            errorRate: metrics.errorRate,
            timestamp: Date.now()
        };
    }

    @Get('schema')
    async validateSchema(@Query('version') version: string) {
        return {
            schema: await this.schemaValidator.getSchema(version),
            validation: 'available'
        };
    }
}