/**
 * Swarm Orchestration Controller
 * Handles multi-agent swarm coordination, task distribution, and agent communication
 */
export declare class SwarmOrchestrationController {
    private readonly logger;
    createSwarm(createSwarmDto: any): Promise<{
        message: string;
    }>;
    getSwarms(status: string, type: string, page: number, limit: number): Promise<any[]>;
    getSwarmById(swarmId: string): Promise<{}>;
    updateSwarm(swarmId: string, updateSwarmDto: any): Promise<{
        message: string;
    }>;
    deleteSwarm(swarmId: string): Promise<{
        message: string;
    }>;
    startSwarm(swarmId: string): Promise<{
        message: string;
    }>;
    stopSwarm(swarmId: string): Promise<{
        message: string;
    }>;
    getSwarmStatus(swarmId: string): Promise<{
        status: string;
        agents: any[];
        tasks: any[];
    }>;
    addAgentToSwarm(swarmId: string, addAgentDto: any): Promise<{
        message: string;
    }>;
    removeAgentFromSwarm(swarmId: string, agentId: string): Promise<{
        message: string;
    }>;
    assignTaskToSwarm(swarmId: string, assignTaskDto: any): Promise<{
        message: string;
    }>;
    getSwarmMetrics(swarmId: string, period?: string): Promise<{
        efficiency: number;
        completedTasks: number;
        activeAgents: number;
    }>;
    optimizeCoordination(optimizeDto: any): Promise<{
        message: string;
    }>;
    getSwarmTemplates(): Promise<any[]>;
    createSwarmTemplate(createTemplateDto: any): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=swarm-orchestration.controller.d.ts.map