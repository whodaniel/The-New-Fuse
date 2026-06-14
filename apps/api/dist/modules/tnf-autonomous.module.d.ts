import { OnModuleInit } from '@nestjs/common';
import { AgentSwarmService } from './director/agent-swarm.service';
import { BMADService } from './director/bmad.service';
import { DirectorService } from './director/director.service';
/**
 * TNF Autonomous Module
 * Main module that wires everything together using the standardized Director components.
 */
export declare class TNFAutonomousModule implements OnModuleInit {
    private readonly director;
    private readonly bmad;
    private readonly swarm;
    private readonly logger;
    constructor(director: DirectorService, bmad: BMADService, swarm: AgentSwarmService);
    onModuleInit(): Promise<void>;
    /**
     * Get overall system status
     */
    getSystemStatus(): {
        director: {
            isRunning: boolean;
            cycleCount: number;
            uptime: number;
        };
        bmad: {
            skills: number;
            tools: number;
        };
        swarm: {
            totalAgents: number;
            onlineAgents: number;
            offlineAgents: number;
            agentsByCapability: Record<string, number>;
        };
        uptime: number;
    };
}
export default TNFAutonomousModule;
//# sourceMappingURL=tnf-autonomous.module.d.ts.map