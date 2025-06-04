export declare enum AgentType {
    BASE = "base",
    ENHANCED = "enhanced",
    RESEARCH = "research",
    CASCADE = "cascade",
    WORKFLOW = "workflow"
}
export declare class CreateAgentDto {
    name: string;
    type: AgentType;
    config?: Record<string, any>;
    description?: string;
}
export declare class UpdateAgentDto {
    name?: string;
    config?: Record<string, any>;
    description?: string;
}
