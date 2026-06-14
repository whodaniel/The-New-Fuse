/**
 * Browser Hub Swarm Controller
 *
 * REST API for controlling the Browser Hub Improvement Agent Swarm.
 */
import { BrowserHubSwarmService } from './browser-hub-swarm.service';
export declare class BrowserHubSwarmController {
    private readonly swarmService;
    private readonly logger;
    constructor(swarmService: BrowserHubSwarmService);
    /**
     * Get current swarm status
     */
    getStatus(): import("./browser-hub-swarm.service").SwarmStatus;
    /**
     * Load the Browser Hub codebase for analysis
     */
    loadCodebase(body: {
        path?: string;
    }): Promise<{
        success: boolean;
        message: string;
        path: string;
    }>;
    /**
     * Run a single iteration of all agents
     */
    runIteration(): Promise<import("./browser-hub-swarm.service").SwarmStatus>;
    /**
     * Run until target score achieved or max iterations
     */
    runUntilComplete(): Promise<import("./browser-hub-swarm.service").SwarmStatus>;
    /**
     * Get all issues from all agents
     */
    getAllIssues(): {
        total: number;
        critical: number;
        major: number;
        minor: number;
        issues: import("./browser-hub-swarm.service").Issue[];
    };
    /**
     * Get all suggestions
     */
    getAllSuggestions(): {
        suggestions: string[];
    };
    /**
     * Generate comprehensive improvement plan
     */
    getImprovementPlan(): object;
    /**
     * Run demo analysis of Browser Hub
     */
    runDemo(): Promise<{
        message: string;
        status: import("./browser-hub-swarm.service").SwarmStatus;
        improvementPlan: object;
        issues: import("./browser-hub-swarm.service").Issue[];
        suggestions: string[];
    }>;
}
//# sourceMappingURL=browser-hub-swarm.controller.d.ts.map