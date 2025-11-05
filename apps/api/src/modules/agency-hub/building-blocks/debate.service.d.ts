export interface DebatePosition {
    agentId: string;
    position: string;
    arguments: string[];
    evidence: string[];
    confidence: number;
}
export interface DebateResult {
    winner: string;
    consensus: string;
    reasoning: string;
    participantScores: Record<string, number>;
}
export declare class DebateService {
    private readonly logger;
    /**
     * Initialize a debate between agents
     */
    initializeDebate(topic: string, participants: string[], rules?: any): Promise<string>;
    /**
     * Submit a position for debate
     */
    submitPosition(debateId: string, position: DebatePosition): Promise<void>;
    /**
     * Evaluate debate and determine result
     */
    evaluateDebate(debateId: string, positions: DebatePosition[]): Promise<DebateResult>;
    /**
     * Facilitate multi-round debate
     */
    facilitateMultiRoundDebate(topic: string, participants: string[], rounds?: number): Promise<DebateResult>;
}
//# sourceMappingURL=debate.service.d.ts.map