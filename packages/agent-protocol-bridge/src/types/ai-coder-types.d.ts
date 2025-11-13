/**
 * AI Coder Types for Multi-Instance Coordination
 * Extends existing agent configuration for specialized AI coding agents
 */
import { AgentConfiguration, AgentCapability, ExecutionContext } from '../services/AgentHub';
export type AICoderType = 'claude' | 'copilot' | 'cursor' | 'cline' | 'aider' | 'continue' | 'sourcegraph';
export type SpecializationType = 'frontend' | 'backend' | 'fullstack' | 'ml' | 'devops' | 'mobile' | 'data' | 'security';
export type CoordinationStrategy = 'single' | 'collaborative' | 'voting' | 'review_chain' | 'specialized' | 'consensus';
export type IsolationMode = 'headless_worker' | 'container' | 'vm' | 'process';
export interface AICoderCapability extends AgentCapability {
    name: 'code_generation' | 'code_review' | 'refactoring' | 'testing' | 'debugging' | 'documentation' | 'optimization' | 'security_analysis';
    specialization?: SpecializationType;
    languages: string[];
    frameworks: string[];
    testingFrameworks?: string[];
    buildSystems?: string[];
    confidence: number;
    contextWindow?: number;
}
export interface AICoderWorkspaceContext {
    rootPath: string;
    gitBranch?: string;
    gitStatus?: {
        uncommittedChanges: boolean;
        conflictMarkers: boolean;
        currentCommit: string;
    };
    contextFiles: string[];
    excludePatterns: string[];
    dependencies: {
        package?: any;
        lockfile?: string;
        devDependencies?: any;
    };
    buildConfig?: {
        buildSystem: string;
        configFiles: string[];
        outputDir?: string;
    };
    testConfig?: {
        framework: string;
        configFiles: string[];
        testDir?: string;
        coverage?: boolean;
    };
}
export interface AICoderConfiguration extends Omit<AgentConfiguration, 'capabilities' | 'configuration'> {
    type: 'AI_CODER';
    aiCoderType: AICoderType;
    capabilities: AICoderCapability[];
    configuration: {
        provider: AICoderType;
        model?: string;
        version?: string;
        isolationMode: IsolationMode;
        endpoint?: string;
        projectPath: string;
        preferences: {
            codeStyle?: 'google' | 'airbnb' | 'standard' | 'prettier' | 'custom';
            testFramework?: string;
            primaryLanguages: string[];
            frameworks: string[];
            linting?: boolean;
            formatting?: boolean;
            typeChecking?: boolean;
        };
        limits: {
            maxTokens?: number;
            timeout?: number;
            maxRetries?: number;
            rateLimit?: {
                requests: number;
                window: number;
            };
        };
        collaboration: {
            allowPeerReview: boolean;
            allowConsensus: boolean;
            trustLevel: 'low' | 'medium' | 'high';
            specializations: SpecializationType[];
        };
    };
    workspace: AICoderWorkspaceContext;
}
export interface AICoderTask {
    id: string;
    type: 'code_generation' | 'code_review' | 'refactoring' | 'testing' | 'debugging' | 'documentation' | 'optimization';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'failed' | 'cancelled';
    codeContext: {
        language: string;
        framework?: string;
        files: string[];
        selection?: {
            file: string;
            start: {
                line: number;
                character: number;
            };
            end: {
                line: number;
                character: number;
            };
        };
        dependencies?: string[];
        testFiles?: string[];
    };
    requirements: {
        functionality: string;
        constraints?: string[];
        testCoverage?: number;
        documentation?: boolean;
        codeStyle?: string;
        performance?: {
            maxResponseTime?: number;
            maxMemoryUsage?: number;
        };
        security?: {
            vulnerabilityScanning?: boolean;
            dataValidation?: boolean;
        };
    };
    coordination: {
        strategy: CoordinationStrategy;
        assignedAgents: string[];
        peerReviewers?: string[];
        votingAgents?: string[];
        consensusThreshold?: number;
        conflictResolution?: 'auto' | 'manual' | 'vote';
    };
    execution: {
        startTime?: Date;
        endTime?: Date;
        estimatedDuration?: number;
        actualDuration?: number;
        retryCount?: number;
        lastError?: string;
    };
    results?: {
        agentId: string;
        code?: string;
        tests?: string;
        documentation?: string;
        review?: AICoderReview;
        metrics?: AICoderMetrics;
    }[];
    finalResult?: {
        selectedSolution: string;
        mergedCode?: string;
        consensusScore?: number;
        reviewComments?: string[];
        qualityScore?: number;
    };
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    workspace: string;
    gitCommit?: string;
}
export interface AICoderReview {
    reviewerId: string;
    targetAgentId: string;
    score: number;
    comments: ReviewComment[];
    recommendations: string[];
    approved: boolean;
    blockers?: string[];
    suggestions?: string[];
    timestamp: Date;
}
export interface ReviewComment {
    file: string;
    line?: number;
    column?: number;
    type: 'error' | 'warning' | 'suggestion' | 'praise';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'logic' | 'performance' | 'security' | 'style' | 'maintainability';
}
export interface AICoderMetrics {
    agentId: string;
    taskId: string;
    executionTime: number;
    tokenUsage?: {
        input: number;
        output: number;
        total: number;
    };
    codeQuality: {
        linesOfCode: number;
        complexity?: number;
        testCoverage?: number;
        duplication?: number;
    };
    performance: {
        buildTime?: number;
        testTime?: number;
        memoryUsage?: number;
    };
    collaboration: {
        reviewsGiven: number;
        reviewsReceived: number;
        consensusParticipation: number;
        conflictResolutions: number;
    };
    timestamp: Date;
}
export interface AICoderTaskResult {
    taskId: string;
    status: 'success' | 'partial' | 'failed';
    results: {
        agentId: string;
        output: {
            code?: string;
            tests?: string;
            documentation?: string;
            review?: AICoderReview;
        };
        metrics: AICoderMetrics;
        confidence: number;
        warnings?: string[];
        errors?: string[];
    }[];
    finalResult?: {
        selectedSolution: string;
        mergedOutput?: {
            code: string;
            tests?: string;
            documentation?: string;
        };
        consensusData?: {
            votes: Record<string, number>;
            finalScore: number;
            agreement: number;
        };
        qualityAssessment?: {
            codeQuality: number;
            testQuality: number;
            documentation: number;
            overall: number;
        };
    };
    executionTime: number;
    tokensUsed?: number;
    warnings?: string[];
    errors?: string[];
    timestamp: Date;
}
export interface AICoderSpawnRequest {
    agentType: AICoderType;
    model?: string;
    version?: string;
    projectPath: string;
    specialization?: SpecializationType;
    capabilities: string[];
    workspace?: {
        branch?: string;
        contextFiles?: string[];
        excludePatterns?: string[];
    };
    preferences?: {
        codeStyle?: string;
        testFramework?: string;
        languages?: string[];
        frameworks?: string[];
    };
    limits?: {
        maxTokens?: number;
        timeout?: number;
        rateLimit?: {
            requests: number;
            window: number;
        };
    };
    collaboration?: {
        allowPeerReview?: boolean;
        allowConsensus?: boolean;
        trustLevel?: 'low' | 'medium' | 'high';
    };
}
export interface AICoderSpawnResponse {
    agentId: string;
    status: 'spawning' | 'ready' | 'failed';
    endpoint?: string;
    capabilities: AICoderCapability[];
    workspace: AICoderWorkspaceContext;
    estimatedStartupTime?: number;
    errors?: string[];
    warnings?: string[];
}
export interface AICoderCoordinationRequest {
    task: string;
    type: 'code_generation' | 'code_review' | 'refactoring' | 'testing' | 'debugging';
    requirements: {
        functionality: string;
        constraints?: string[];
        testCoverage?: number;
        documentation?: boolean;
    };
    context: {
        files: string[];
        language: string;
        framework?: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
    };
    coordination: {
        strategy: CoordinationStrategy;
        agentIds?: string[];
        specializations?: SpecializationType[];
        requireReview?: boolean;
        consensusThreshold?: number;
    };
    workspace: {
        path: string;
        branch?: string;
        gitCommit?: string;
    };
}
export interface AICoderCoordinationResponse {
    coordinationId: string;
    taskPlan: {
        mainTask: AICoderTask;
        subTasks?: AICoderTask[];
        dependencies?: Record<string, string[]>;
    };
    assignedAgents: {
        agentId: string;
        role: 'primary' | 'reviewer' | 'voter' | 'specialist';
        tasks: string[];
    }[];
    estimatedCompletion: Date;
    strategy: CoordinationStrategy;
    status: 'planned' | 'executing' | 'review' | 'completed' | 'failed';
}
export interface AICoderStatus {
    agentId: string;
    name: string;
    aiCoderType: AICoderType;
    status: 'idle' | 'busy' | 'offline' | 'error';
    currentTask?: string;
    capabilities: AICoderCapability[];
    specializations: SpecializationType[];
    workspace: {
        path: string;
        branch?: string;
        lastSync?: Date;
    };
    performance: {
        totalTasks: number;
        successRate: number;
        averageTime: number;
        qualityScore: number;
    };
    health: {
        uptime: number;
        memoryUsage?: number;
        responseTime: number;
        errorRate: number;
    };
    collaboration: {
        reviewsGiven: number;
        reviewsReceived: number;
        consensusParticipation: number;
        trustScore: number;
    };
    lastActivity: Date;
    endpoint?: string;
}
export interface AICoderExecutionContext extends ExecutionContext {
    codebase: {
        language: string;
        framework?: string;
        testFramework?: string;
        buildSystem?: string;
        dependencies: string[];
        structure?: {
            sourceDir: string;
            testDir: string;
            configDir: string;
            docsDir?: string;
        };
    };
    git: {
        branch: string;
        uncommittedChanges: boolean;
        conflictMarkers?: boolean;
        lastCommit?: string;
        remoteUrl?: string;
    };
    collaboration: {
        activeAgents: string[];
        sharedFiles: string[];
        lockFiles?: string[];
        conflictResolution?: 'merge' | 'vote' | 'human' | 'auto';
        reviewQueue?: string[];
    };
    quality: {
        linting: boolean;
        formatting: boolean;
        typeChecking: boolean;
        testing: boolean;
        coverage?: number;
    };
}
export interface AICoderEvents {
    agentSpawned: (agent: AICoderConfiguration) => void;
    agentStatusChanged: (agentId: string, status: string) => void;
    taskAssigned: (task: AICoderTask) => void;
    taskCompleted: (task: AICoderTask, result: AICoderTaskResult) => void;
    reviewRequested: (taskId: string, reviewerId: string) => void;
    reviewCompleted: (review: AICoderReview) => void;
    consensusReached: (taskId: string, result: any) => void;
    conflictDetected: (taskId: string, conflicts: any[]) => void;
    collaborationStarted: (agents: string[], taskId: string) => void;
    collaborationEnded: (agents: string[], taskId: string, result: any) => void;
}
export type AICoderEventType = keyof AICoderEvents;
export type AICoderTaskType = AICoderTask['type'];
export type AICoderTaskStatus = AICoderTask['status'];
export type AICoderCapabilityName = AICoderCapability['name'];
//# sourceMappingURL=ai-coder-types.d.ts.map