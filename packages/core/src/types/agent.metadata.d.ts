export interface AgentMetadata {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    lastActive?: Date;
    lastHeartbeat?: Date;
    capabilities: AgentCapability[];
    personalityTraits: string[];
    communicationStyle: string;
    expertiseAreas: string[];
    performance?: {
        responseTime?: number;
        tokenUsage?: number;
        errorRate?: number;
        successRate?: number;
        totalTasks?: number;
        averageResponseTime?: number;
        userSatisfaction?: number;
        accuracyScore?: number;
    };
    usage?: {
        totalRequests?: number;
        activeUsers?: number;
        peakConcurrency?: number;
        resourceUtilization?: number;
    };
    skillDevelopment?: {
        currentLevel: number;
        targetLevel: number;
        learningPath: string[];
        progress: number;
        adaptiveCapabilities?: string[];
        learningStyle?: string;
    };
    reasoningStrategies?: {
        primaryMethod: string;
        fallbackMethods: string[];
        decisionMakingStyle: string;
        problemSolvingApproach: string;
    };
    characterArcs?: {
        currentArc: string;
        progressionStage: string;
        milestones: Array<{
            description: string;
            achieved: boolean;
            timestamp?: Date;
        }>;
    };
    relationships?: {
        collaborators: string[];
        dependencies: string[];
        integrations: Array<{
            service: string;
            status: string;
            permissions: string[];
        }>;
    };
    config?: Record<string, unknown>;
    state?: {
        currentContext?: string;
        activeProcesses?: string[];
        memoryUtilization?: number;
        systemLoad?: number;
    };
}
