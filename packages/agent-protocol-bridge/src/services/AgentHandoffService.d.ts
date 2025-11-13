/**
 * AgentHandoffService.ts
 *
 * Enhanced agent handoff system with plan context for seamless task delegation.
 * Supports Traycer-style handoff to Claude Code, Cursor, Gemini, Codex, etc.
 */
import { EventEmitter } from 'events';
import { TaskPlan, PlanStep } from './TaskPlanningService';
import { AgentConfiguration } from './AgentHub';
export interface HandoffRequest {
    id: string;
    fromAgent?: string;
    toAgent: string;
    planId?: string;
    stepId?: string;
    context: HandoffContext;
    payload: HandoffPayload;
    options: HandoffOptions;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export interface HandoffContext {
    workspace: string;
    files: string[];
    planState?: TaskPlan;
    stepContext?: PlanStep;
    conversationHistory?: ConversationEntry[];
    codeSelection?: {
        file: string;
        startLine: number;
        endLine: number;
        content: string;
    };
    previousResults?: any[];
    chainContext?: ChainContext;
}
export interface HandoffPayload {
    taskType: 'plan_execution' | 'step_execution' | 'verification' | 'analysis' | 'custom';
    instructions: string;
    planContent?: string;
    stepInstructions?: string;
    verificationCriteria?: string[];
    analysisScope?: string[];
    customData?: Record<string, any>;
}
export interface HandoffOptions {
    timeout?: number;
    retryCount?: number;
    fallbackAgents?: string[];
    preserveContext?: boolean;
    streamResponse?: boolean;
    waitForCompletion?: boolean;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
}
export interface ConversationEntry {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface ChainContext {
    chainId: string;
    previousSteps: HandoffResult[];
    accumulatedContext: Record<string, any>;
    nextSteps?: string[];
}
export interface HandoffResult {
    handoffId: string;
    agentId: string;
    status: 'success' | 'error' | 'partial';
    result?: any;
    output?: string;
    error?: string;
    executionTime?: number;
    tokensUsed?: number;
    filesModified?: string[];
    metadata?: Record<string, any>;
    timestamp: Date;
}
export interface AgentCapabilityMatch {
    agentId: string;
    score: number;
    matchedCapabilities: string[];
    missingCapabilities: string[];
    reasons: string[];
}
export interface HandoffStrategy {
    type: 'direct' | 'fallback_chain' | 'parallel' | 'best_match' | 'load_balanced';
    primaryAgent?: string;
    fallbackAgents?: string[];
    criteria?: {
        capabilities?: string[];
        performance?: boolean;
        availability?: boolean;
        cost?: boolean;
    };
}
export declare class AgentHandoffService extends EventEmitter {
    private availableAgents;
    private executionService?;
    private handoffRequests;
    private activeChains;
    private agentCapabilities;
    private agentPerformance;
    constructor(availableAgents: Map<string, AgentConfiguration>, executionService?: any | undefined);
    /**
     * Execute a plan handoff to a specific agent
     */
    executePlanHandoff(agentId: string, plan: TaskPlan, options?: HandoffOptions): Promise<HandoffResult>;
    /**
     * Execute a step handoff to a specific agent
     */
    executeStepHandoff(agentId: string, plan: TaskPlan, step: PlanStep, options?: HandoffOptions): Promise<HandoffResult>;
    /**
     * Execute verification handoff
     */
    executeVerificationHandoff(agentId: string, plan: TaskPlan, verificationCriteria: string[], options?: HandoffOptions): Promise<HandoffResult>;
    /**
     * Find the best agent for a task based on capabilities and context
     */
    findBestAgent(taskType: string, requiredCapabilities: string[], context?: HandoffContext, excludeAgents?: string[]): Promise<AgentCapabilityMatch | null>;
    /**
     * Execute handoff with strategy (direct, fallback, parallel, etc.)
     */
    executeWithStrategy(strategy: HandoffStrategy, plan: TaskPlan, step?: PlanStep, options?: HandoffOptions): Promise<HandoffResult>;
    catch(error: any): void;
}
//# sourceMappingURL=AgentHandoffService.d.ts.map