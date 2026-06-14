import { EventEmitter } from 'node:events';
export declare enum ConversationPhase {
    INITIALIZING = "initializing",
    AGENT_DISCOVERY = "agent_discovery",
    TASK_ASSIGNMENT = "task_assignment",
    EXECUTION = "execution",
    REVIEW = "review",
    COMPLETION = "completion",
    STALLED = "stalled",
    RECOVERY = "recovery",
    TERMINATED = "terminated",
    PAUSED = "paused"
}
export interface ConversationConfig {
    maxDuration: number;
    phaseTimeouts: Record<ConversationPhase, number>;
    autoAdvance: boolean;
    requireHumanApproval: boolean;
}
export declare class ConversationStateMachine extends EventEmitter {
    private phase;
    private phaseStartedAt;
    private config;
    private lastActivityAt;
    private channelId;
    constructor(channelId: string, config?: Partial<ConversationConfig>);
    get currentPhase(): ConversationPhase;
    getPhase(): ConversationPhase;
    get durationInPhase(): number;
    recordActivity(): void;
    pause(): Promise<void>;
    resume(): Promise<void>;
    transition(newPhase: ConversationPhase): Promise<void>;
    private exitPhase;
    private enterPhase;
    private handleStallEntry;
    private handleRecoveryEntry;
}
//# sourceMappingURL=conversation-state-machine.d.ts.map