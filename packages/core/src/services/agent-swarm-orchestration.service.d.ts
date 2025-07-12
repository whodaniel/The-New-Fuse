/**
 * Agent Swarm Orchestration Service
 * Inspired by the Python Agency Hub/s swarm architecture
 * Implements hierarchical agent organization, communication flows, and service routing
 */
import { PrismaService } from '@the-new-fuse/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class AgentSwarmOrchestrationService {
    private readonly prisma;
    private readonly eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    initializeSwarm(agencyId: string, config?: any): Promise<any>;
    executeSwarmTask(taskId: string, config?: any): Promise<any>;
    getSwarmStatus(agencyId: string): Promise<any>;
    getSwarmMetrics(agencyId: string, timeframe?: string): Promise<any>;
    manageAgentCommunication(agencyId: string, messageData: any): Promise<any>;
    orchestrateServiceRequest(requestId: string, agencyId: string): Promise<any>;
    getExecutionMetrics(agencyId: string): Promise<any>;
    createExecution(agencyId: string, serviceRequestId: string, executionPlan: any, configuration: any): Promise<any>;
    getExecutions(agencyId: string, filters: any): Promise<any>;
    getExecutionDetails(executionId: string): Promise<any>;
    updateExecutionStatus(executionId: string, status: string, reason?: string): Promise<any>;
    updateExecutionStep(executionId: string, stepId: string, stepUpdate: any): Promise<any>;
    sendMessage(executionId: string, fromAgentId: string, toAgentId: string, type: string, content: any, priority?: string): Promise<any>;
    getMessages(executionId: string, filters: any): Promise<any>;
    streamExecutionProgress(executionId: string): any;
    performHealthCheck(agencyId: string): Promise<any>;
    getPerformanceMetrics(agencyId: string, timeframe: string): Promise<any>;
}
//# sourceMappingURL=agent-swarm-orchestration.service.d.ts.map