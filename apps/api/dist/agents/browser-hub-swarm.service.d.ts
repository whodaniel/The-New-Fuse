/**
 * Browser Hub Improvement Agent Swarm
 *
 * A coordinated team of specialized self-improving agents focused on
 * making the Browser Hub Electron App world-class in all aspects.
 *
 * AGENTS:
 * 1. UI/UX Agent - Design, layout, user experience
 * 2. Extension Agent - Chrome extension handling, toolbar, management
 * 3. Integration Agent - System synergy, API connections, data flow
 * 4. Brand Agent - TNF design system compliance (uses existing service)
 * 5. Code Quality Agent - Architecture, performance, maintainability
 */
import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '@the-new-fuse/database';
export interface AgentCapability {
    name: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
}
export interface Issue {
    id: string;
    type: string;
    severity: 'critical' | 'major' | 'minor';
    description: string;
    location: string;
    suggestedFix?: string;
    codeExample?: string;
    status: 'open' | 'in-progress' | 'fixed' | 'verified';
}
export interface AgentReport {
    agentId: string;
    agentName: string;
    timestamp: Date;
    issues: Issue[];
    suggestions: string[];
    score: number;
    iteration: number;
}
export interface SwarmStatus {
    totalAgents: number;
    activeAgents: number;
    currentIteration: number;
    overallScore: number;
    reports: AgentReport[];
    targetScore: number;
    phaseName: string;
}
export declare class BrowserHubSwarmService implements OnModuleInit {
    private readonly drizzle;
    private readonly eventEmitter;
    private readonly logger;
    private agents;
    private currentIteration;
    private targetScore;
    private maxIterations;
    private codebase;
    private swarmStatus;
    constructor(drizzle: DatabaseService, eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    /**
     * Load the Browser Hub codebase for analysis
     */
    loadCodebase(basePath: string): Promise<void>;
    /**
     * Run a single iteration of all agents
     */
    runIteration(): Promise<SwarmStatus>;
    /**
     * Run iterations until target score is achieved or max iterations reached
     */
    runUntilComplete(): Promise<SwarmStatus>;
    /**
     * Get current swarm status
     */
    getStatus(): SwarmStatus;
    /**
     * Get all issues from all agents
     */
    getAllIssues(): Issue[];
    /**
     * Get all suggestions from all agents
     */
    getAllSuggestions(): string[];
    /**
     * Generate improvement plan
     */
    generateImprovementPlan(): object;
    private estimateEffort;
}
//# sourceMappingURL=browser-hub-swarm.service.d.ts.map