/**
 * TaskPlanningService.ts
 *
 * Traycer-style task planning and plan generation service.
 * Converts user intent into detailed, step-by-step implementation plans.
 */
import { EventEmitter } from 'events';
export interface PlanStep {
    id: string;
    title: string;
    description: string;
    type: 'file_change' | 'command' | 'verification' | 'analysis' | 'testing';
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    fileChanges?: FileChange[];
    commands?: string[];
    dependencies?: string[];
    estimatedDuration?: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignedAgent?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface FileChange {
    path: string;
    operation: 'create' | 'modify' | 'delete' | 'rename';
    content?: string;
    startLine?: number;
    endLine?: number;
    description: string;
}
export interface TaskPlan {
    id: string;
    title: string;
    description: string;
    userIntent: string;
    status: 'planning' | 'plan_generated' | 'in_progress' | 'completed' | 'failed';
    steps: PlanStep[];
    context: PlanContext;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedDuration?: number;
    actualDuration?: number;
    assignedAgents: string[];
    history: PlanHistoryEntry[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export interface PlanContext {
    workspace: string;
    repository?: string;
    branch?: string;
    files: string[];
    codebase?: {
        language: string;
        framework?: string;
        size: 'small' | 'medium' | 'large';
        complexity: 'low' | 'medium' | 'high';
    };
    requirements?: string[];
    constraints?: string[];
    testingStrategy?: string;
}
export interface PlanHistoryEntry {
    id: string;
    action: 'created' | 'updated' | 'step_added' | 'step_completed' | 'agent_assigned' | 'comment_added';
    description: string;
    data?: any;
    timestamp: Date;
    userId?: string;
}
export interface PlanGenerationOptions {
    analysisDepth: 'basic' | 'comprehensive' | 'detailed';
    includeVerification: boolean;
    includeTesting: boolean;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeConstraint?: number;
    preferredAgents?: string[];
}
export interface PlanComment {
    id: string;
    planId: string;
    stepId?: string;
    content: string;
    type: 'question' | 'suggestion' | 'concern' | 'approval' | 'verification';
    status: 'open' | 'addressed' | 'resolved';
    priority: 'low' | 'medium' | 'high';
    author?: string;
    createdAt: Date;
    resolvedAt?: Date;
}
export declare class TaskPlanningService extends EventEmitter {
    private plans;
    private comments;
    constructor();
    /**
     * Generate a comprehensive plan from user intent
     */
    generatePlan(userIntent: string, context: PlanContext, options?: PlanGenerationOptions): Promise<TaskPlan>;
    /**
     * Update an existing plan with modifications
     */
    updatePlan(planId: string, updates: Partial<TaskPlan>): Promise<TaskPlan>;
    /**
     * Update a specific step in a plan
     */
    updatePlanStep(planId: string, stepId: string, updates: Partial<PlanStep>): Promise<PlanStep>;
    step: any;
    status: string;
    step: any;
    updatedAt: Date;
    if(result: any): void;
    plan: any;
    updatedAt: Date;
}
//# sourceMappingURL=TaskPlanningService.d.ts.map