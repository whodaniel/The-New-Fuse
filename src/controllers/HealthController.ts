import { Controller, Get } from '@nestjs/common';
import { AgentMetricsService } from '../services/AgentMetricsService.js';
import { ConfigurationManager } from '../config/A2AConfig.js';

@Controller('health')
export class HealthController {
    constructor(
        private metricsService: AgentMetricsService,
        private config: ConfigurationManager
    ) {}

    @Get()
    async checkHealth() {
        return {
            status: 'healthy',
            timestamp: Date.now(),
            version: this.config.getConfig().protocolVersion
        };
    }

    @Get('ready')
    async checkReadiness() {
        const metrics = await this.metricsService.getSystemMetrics();
        return {
            status: 'ready',
            metrics
        };
    }
}