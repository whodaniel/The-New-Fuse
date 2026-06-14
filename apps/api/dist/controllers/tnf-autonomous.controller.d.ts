/**
 * TNF Autonomous System Controller
 *
 * REST API endpoints for managing the autonomous system:
 * - Director status and control
 * - BMAD cycle execution
 * - Agent swarm management
 * - System health and metrics
 */
import { AgentSwarmService } from '../modules/director/agent-swarm.service';
import { BMADService } from '../modules/director/bmad.service';
import { DirectorService } from '../modules/director/director.service';
interface RegisterAgentDto {
    id: string;
    name: string;
    capabilities: string[];
}
interface ExecuteBMADCycleDto {
    skillIds: string[];
    contextPurpose: string;
    templateId: string;
    variables: Record<string, unknown>;
}
export declare class TNFAutonomousController {
    private readonly director;
    private readonly bmad;
    private readonly swarm;
    private readonly logger;
    constructor(director: DirectorService, bmad: BMADService, swarm: AgentSwarmService);
    /**
     * Get overall autonomous system status
     */
    getSystemStatus(): Promise<{
        success: boolean;
        data: {
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
            timestamp: string;
            uptime: number;
        };
    }>;
    /**
     * Get system health
     */
    getHealth(): Promise<{
        status: string;
        checks: {
            director: string;
            swarm: string;
        };
        timestamp: string;
    }>;
    /**
     * Get director status
     */
    getDirectorStatus(): Promise<{
        success: boolean;
        data: {
            isRunning: boolean;
            cycleCount: number;
            uptime: number;
        };
    }>;
    /**
     * Start the director loop
     */
    startDirector(): Promise<{
        success: boolean;
        message: string;
        data: {
            isRunning: boolean;
            cycleCount: number;
            uptime: number;
        };
    }>;
    /**
     * Stop the director loop
     */
    stopDirector(): Promise<{
        success: boolean;
        message: string;
        data: {
            isRunning: boolean;
            cycleCount: number;
            uptime: number;
        };
    }>;
    /**
     * Get BMAD statistics
     */
    getBMADStats(): Promise<{
        success: boolean;
        data: {
            skills: number;
            tools: number;
        };
    }>;
    /**
     * Execute a BMAD cycle
     */
    executeBMADCycle(dto: ExecuteBMADCycleDto): Promise<{
        success: boolean;
        message: string;
        data: {
            skills: number;
            tools: number;
            contextTokens: number;
            success: boolean;
        };
    }>;
    /**
     * Register a new skill
     */
    registerSkill(body: {
        id: string;
        skill: unknown;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            skills: number;
            tools: number;
        };
    }>;
    /**
     * Get swarm statistics
     */
    getSwarmStats(): Promise<{
        success: boolean;
        data: {
            totalAgents: number;
            onlineAgents: number;
            offlineAgents: number;
            agentsByCapability: Record<string, number>;
        };
    }>;
    /**
     * Get real-time swarm activity logs
     */
    getSwarmLogs(): Promise<{
        success: boolean;
        data: any[];
    }>;
    /**
     * Register a new agent
     */
    registerAgent(dto: RegisterAgentDto): Promise<{
        success: boolean;
        message: string;
        data: {
            agent: RegisterAgentDto;
            swarmStats: {
                totalAgents: number;
                onlineAgents: number;
                offlineAgents: number;
                agentsByCapability: Record<string, number>;
            };
        };
    }>;
    /**
     * Unregister an agent
     */
    unregisterAgent(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            totalAgents: number;
            onlineAgents: number;
            offlineAgents: number;
            agentsByCapability: Record<string, number>;
        };
    }>;
    /**
     * Record agent heartbeat
     */
    recordHeartbeat(id: string): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    /**
     * Find agents by capability
     */
    findAgentsByCapability(capability: string): Promise<{
        success: boolean;
        data: {
            capability: string;
            agents: any[];
            count: number;
        };
    }>;
}
export default TNFAutonomousController;
//# sourceMappingURL=tnf-autonomous.controller.d.ts.map