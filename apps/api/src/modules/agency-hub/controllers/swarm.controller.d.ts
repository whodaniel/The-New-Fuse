import { Observable } from 'rxjs';
import { AgentSwarmOrchestrationService } from '@the-new-fuse/core/services/agent-swarm-orchestration.service';
export declare class SwarmController {
    private readonly swarmOrchestrationService;
    constructor(swarmOrchestrationService: AgentSwarmOrchestrationService);
    createExecution(agencyId: string, executionDto: any): Promise<any>;
    getExecutions(agencyId: string, status?: string, limit?: number, offset?: number): Promise<any>;
    getExecution(executionId: string): Promise<any>;
    updateExecutionStatus(executionId: string, statusDto: any): Promise<any>;
    updateExecutionStep(executionId: string, stepId: string, stepUpdateDto: any): Promise<any>;
    sendMessage(executionId: string, messageDto: any): Promise<any>;
    getMessages(executionId: string, agentId?: string, limit?: number): Promise<any>;
    streamExecutionProgress(executionId: string): Observable<any>;
    performHealthCheck(agencyId: string): Promise<any>;
    getMetrics(agencyId: string, timeframe?: string): Promise<any>;
}
//# sourceMappingURL=swarm.controller.d.ts.map