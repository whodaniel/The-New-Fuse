export declare class ResourceManager {
    constructor(config: any);
    getDefaultLimits(): {
        max_total_tokens: number;
        max_input_tokens: number;
        max_output_tokens: number;
        tokens_per_dollar: number;
    };
    initializeUsage(): {
        used_tokens: number;
        remaining_tokens: any;
        cost_incurred: number;
        timestamp: string;
    };
    setLimits(limits: any): void;
    estimateCost(prompt: any): {
        input_tokens: number;
        estimated_output_tokens: number;
        total_tokens: number;
        estimated_cost: number;
        model_type: any;
    };
    checkContextFit(text: any): (number | boolean)[];
    truncateToFit(text: any): any;
    measureLatency(params: any): {
        startTime: any;
        endTime: any;
        durationMs: number;
    };
    updateUsage(tokens: any): void;
    getUsage(): any;
    countTokens(text: any): number;
}
