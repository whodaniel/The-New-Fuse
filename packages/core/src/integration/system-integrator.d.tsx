import { AgentCommunicationService } from './agent-communication.service.js';
import { SystemHealthService } from './system-health.service.js';
import { LoggingService } from './logging.service.js';
import { MonitoringService } from './monitoring.service.js';
export declare class SystemIntegrator {
    private readonly agentComm;
    private readonly health;
    private readonly logging;
    private readonly monitoring;
    constructor(agentComm: AgentCommunicationService, health: SystemHealthService, logging: LoggingService, monitoring: MonitoringService);
    initialize(): Promise<void>;
}
