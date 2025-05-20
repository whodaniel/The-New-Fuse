import { AgentBridgeService } from '../AgentCommunicationBridge.js';
import { TaskQueueService } from '../../task/TaskQueueService.js';
import { StateManagerService } from '../../services/state/state-manager.service.js';
import { MonitoringService } from '../../monitoring/monitoring.service.js';
export declare class AgentWorkflowService {
    private readonly agentBridge;
    private readonly taskQueue;
    private readonly stateManager;
    private readonly monitor;
    private readonly agentRegistry;
    constructor(agentBridge: AgentBridgeService, taskQueue: TaskQueueService, stateManager: StateManagerService, monitor: MonitoringService, agentRegistry: unknown);
    initiateWorkflow(): Promise<void>;
}
