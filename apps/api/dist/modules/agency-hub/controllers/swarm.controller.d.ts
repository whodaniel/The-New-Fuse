import { Observable } from 'rxjs';
import { AgentSwarmOrchestrationService } from '../services/agent-swarm-orchestration.service';
export declare class SwarmController {
    private readonly swarmOrchestrationService;
    constructor(swarmOrchestrationService: AgentSwarmOrchestrationService);
    getSwarmCapabilityStatus(): {
        available: {
            createExecution: boolean;
            listExecutions: boolean;
            healthCheck: boolean;
            metrics: boolean;
        };
        unavailable: {
            getExecution: boolean;
            updateExecutionStatus: boolean;
            updateExecutionStep: boolean;
            sendMessage: boolean;
            getMessages: boolean;
            streamExecutionProgress: boolean;
        };
        reason: string;
    };
    createExecution(agencyId: string, executionDto: any): Promise<string>;
    getExecutions(agencyId: string, status?: string, limit?: number, offset?: number): Promise<{
        metrics: any;
    }>;
    getExecution(executionId: string): Promise<void>;
    updateExecutionStatus(executionId: string, statusDto: any): Promise<void>;
    updateExecutionStep(executionId: string, stepId: string, stepUpdateDto: any): Promise<void>;
    sendMessage(executionId: string, messageDto: any): Promise<void>;
    getMessages(executionId: string, agentId?: string, limit?: number): Promise<void>;
    streamExecutionProgress(executionId: string): Observable<any>;
    performHealthCheck(agencyId: string): Promise<import("../services/agent-swarm-orchestration.service").SwarmStatus>;
    getMetrics(agencyId: string, timeframe?: string): Promise<any>;
    private notImplemented;
}
//# sourceMappingURL=swarm.controller.d.ts.map