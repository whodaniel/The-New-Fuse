export interface Agent {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'idle' | 'offline';
    personality?: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
        traits?: Record<string, number>;
    };
    skills: string[];
    avatar?: string;
    performance?: number;
    tasks?: Array<{
        id: string;
        name: string;
        progress: number;
    }>;
}
export interface ApiAgent {
    id: string;
    name: string;
    type: string;
    status: string;
    personality: string;
    skills: string[];
}
export interface TrainingConfig {
    model: string;
}
export interface ValidationResult {
    success: boolean;
    errors: string[];
}
export interface TrainingHistory {
    id: string;
    agentId: string;
    model: string;
    startTime: string;
    endTime: string;
    status: string;
}
export interface Collaboration {
    id: string;
    agentIds: string[];
    status: string;
}
export interface AgentMetrics {
    id: string;
    agentId: string;
    metrics: Record<string, any>;
}
export interface OptimizationResult {
    success: boolean;
    parameters: Record<string, any>;
}
