import { Injectable } from '@nestjs/common';
import { AgentCommunicationService } from './agent-communication.service';
import { SystemHealthService } from './system-health.service';
import { LoggingService } from './logging.service';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class SystemIntegrator {
    constructor(
        private readonly agentComm: AgentCommunicationService,
        private readonly health: SystemHealthService,
        private readonly logging: LoggingService,
        private readonly monitoring: MonitoringService
    ) {}

    async initialize(): Promise<void> {
        try {
            await this.logging.initialize();
            await this.health.startHealthChecks();
            await this.monitoring.startMetricsCollection();
            await this.agentComm.establishConnections();
            
            this.logging.info('System initialized successfully');
        } catch (error) {
            this.logging.error('System initialization failed', { error });
            throw error;
        }
    }

    async shutdown(): Promise<void> {
        await Promise.all([
            this.agentComm.closeConnections(),
            this.monitoring.stopMetricsCollection(),
            this.health.stopHealthChecks(),
            this.logging.flush()
        ]);
    }
}