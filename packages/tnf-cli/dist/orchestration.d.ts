import { RedisAgentClient } from './RedisAgentClient.js';
export interface Task {
    id: string;
    name: string;
    description: string;
    skillRef?: string;
    workerRef?: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
    dependencies: string[];
    capability?: string;
    artifacts?: string[];
    payload: any;
    result?: any;
    error?: string;
    attempts: number;
    maxAttempts: number;
    startedAt?: string;
    completedAt?: string;
}
export interface Workflow {
    id: string;
    name: string;
    goal: string;
    tasks: Task[];
    status: 'planning' | 'running' | 'completed' | 'failed';
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    metadata: Record<string, any>;
}
export interface Skill {
    name: string;
    description: string;
    path: string;
    commands: string[];
    triggers: string[];
    confidence: number;
}
export interface Worker {
    id: string;
    name: string;
    role: string;
    platform: string;
    capabilities: string[];
    status: 'active' | 'idle' | 'offline';
    lastSeen: string;
    queue: string;
}
export interface SystemState {
    activeDirectives: string[];
    pendingTasks: number;
    activeWorkers: number;
    skillsAvailable: number;
    lastSync: string;
    health: 'healthy' | 'degraded' | 'critical';
}
export declare class GoalPlanner {
    private goalPatterns;
    private static BUILT_IN_PATTERNS;
    constructor();
    /** Dynamically add patterns discovered from skills */
    addPatternFromSkill(skill: Skill): void;
    /**
     * Parse a natural language goal and decompose it into a structured Workflow.
     * Falls back to a generic single-task workflow if no pattern matches.
     */
    plan(goal: string): Promise<Workflow>;
    private createTask;
}
export declare class SkillRegistry {
    private skills;
    private skillsPath;
    constructor(repoRoot: string);
    /** Scan all SKILL.md files and build the skill index */
    discover(): Promise<Skill[]>;
    /** Parse a single skill directory */
    private parseSkill;
    private extractTriggers;
    /** Find the best matching skill for a given goal or task */
    findSkill(query: string): Promise<Skill | null>;
    /** Get a skill by exact name */
    getSkill(name: string): Skill | undefined;
    getAllSkills(): Skill[];
}
export declare class StateManager {
    private repoRoot;
    private statePath;
    private ledgerPath;
    constructor(repoRoot: string);
    /** Read current system state from LIVING_STATE.md */
    getSystemState(): Promise<SystemState>;
    /** Update LIVING_STATE.md with a new entry */
    appendProgress(step: string): Promise<void>;
    /** Get the current directive from LIVING_STATE */
    getCurrentDirective(): Promise<string | null>;
}
export declare class WorkerPool {
    private client;
    private workers;
    constructor(client: RedisAgentClient);
    /** Scan Redis for available workers */
    discoverWorkers(): Promise<Worker[]>;
    /** Find the best worker for a given task */
    findWorker(task: Task): Promise<Worker | null>;
    /** Send a task to a worker via Redis */
    dispatchToWorker(worker: Worker, task: Task): Promise<boolean>;
}
export declare class EnhancedOrchestrator {
    private client;
    private goalPlanner;
    private skillRegistry;
    private stateManager;
    private workerPool;
    private workerDispatcher;
    private selfImprovement;
    private skillScanner;
    private activeWorkflows;
    private skillCacheLoaded;
    private repoRoot;
    constructor(client: RedisAgentClient, repoRoot: string);
    /** Bootstrap: discover skills, verify state, prepare for operation */
    initialize(): Promise<void>;
    /**
     * Execute a natural language goal.
     * This is the main entry point for autonomous operation.
     */
    executeGoal(goal: string): Promise<Workflow>;
    /**
     * Execute a traditional named workflow (backward compatible)
     */
    executeWorkflow(workflow: Workflow): Promise<boolean>;
    /** Execute a single task using the appropriate skill or real worker dispatch */
    private executeTask;
    private simulateExecution;
    /** Get current system status for monitoring */
    getStatus(): Promise<{
        workflows: number;
        tasks: number;
        skills: number;
        health: string;
    }>;
    /** Proactive health check - suggest actions based on state */
    suggestActions(): Promise<string[]>;
}
export declare class Orchestrator {
    private enhanced;
    constructor(client: RedisAgentClient, repoRoot?: string);
    executeWorkflow(workflowName: string, params?: any): Promise<Workflow | {
        status: string;
        message: string;
    }>;
    /** Direct goal execution - the new powerful interface */
    executeGoal(goal: string): Promise<Workflow>;
    /** Get system status */
    getStatus(): Promise<{
        workflows: number;
        tasks: number;
        skills: number;
        health: string;
    }>;
    /** Get proactive suggestions */
    suggestActions(): Promise<string[]>;
    private legacyExecute;
}
//# sourceMappingURL=orchestration.d.ts.map