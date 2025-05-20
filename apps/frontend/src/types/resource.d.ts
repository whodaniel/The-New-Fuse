export declare enum ModelType {
    CLAUDE_3_OPUS = "claude-3-opus",
    CLAUDE_3_SONNET = "claude-3-sonnet",
    CLAUDE_3_HAIKU = "claude-3-haiku"
}
export interface ResourceLimits {
    max_input_tokens: number;
    max_output_tokens: number;
    max_total_tokens: number;
    tokens_per_dollar: number;
}
export interface ResourceUsage {
    used_tokens: number;
    remaining_tokens: number;
    cost_incurred: number;
    timestamp: string;
}
export interface CostMetrics {
    input_tokens: number;
    estimated_output_tokens: number;
    total_tokens: number;
    estimated_cost: number;
    model_type: ModelType;
}
export interface LatencyParams {
    startTime: number;
    endTime: number;
}
export interface LatencyMetrics {
    startTime: number;
    endTime: number;
    durationMs: number;
}
