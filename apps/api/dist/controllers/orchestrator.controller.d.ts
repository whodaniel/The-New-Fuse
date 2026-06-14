import { AgentSwarmService } from '../modules/director/agent-swarm.service';
import { DirectorService } from '../modules/director/director.service';
export declare class OrchestratorController {
    private readonly director;
    private readonly swarm;
    constructor(director: DirectorService, swarm: AgentSwarmService);
    getHealth(): Promise<{
        status: string;
        checks: {
            director: string;
            swarm: string;
        };
        metrics: {
            totalAgents: number;
            activeAgents: number;
            offlineAgents: number;
            cycleCount: number;
            isRunning: boolean;
        };
        timestamp: string;
    }>;
    getAgents(): Promise<{
        agents: {
            agentId: any;
            id: any;
            name: any;
            status: any;
            capabilities: any;
            lastHeartbeat: any;
        }[];
        count: number;
        timestamp: string;
    }>;
}
//# sourceMappingURL=orchestrator.controller.d.ts.map