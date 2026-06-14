export interface ScalingRule {
    id: string;
    metric: 'connections' | 'cpu' | 'memory' | 'messageRate';
    threshold: number;
    operator: 'gt' | 'lt' | 'gte' | 'lte';
    action: 'scale_up' | 'scale_down';
    stepSize: number;
    cooldownMs: number;
}
export interface ScalingState {
    currentServers: number;
    minServers: number;
    maxServers: number;
    activeConnections: number;
    lastScaleAction: string | null;
    lastScaleTime: string | null;
    rules: ScalingRule[];
}
export interface ScalingDecision {
    action: 'scale_up' | 'scale_down' | 'hold';
    currentServers: number;
    targetServers: number;
    reason: string;
    triggeredBy: string | null;
    timestamp: string;
}
export declare class WebSocketAutoScalingService {
    private readonly logger;
    private state;
    constructor();
    configure(config: Partial<ScalingState>): void;
    private getDefaultRules;
    addRule(rule: ScalingRule): void;
    removeRule(ruleId: string): boolean;
    evaluate(metrics: {
        connections: number;
        cpu: number;
        memory: number;
        messageRate: number;
    }): ScalingDecision;
    getState(): ScalingState;
    provisionFleet(serverCount: number): void;
    private evaluateCondition;
}
//# sourceMappingURL=WebSocketAutoScalingService.d.ts.map