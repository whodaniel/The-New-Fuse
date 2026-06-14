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
export interface Debate {
    id: string;
    topic: string;
    participants: string[];
    rounds: number;
    currentRound: number;
    status: 'INITIALIZED' | 'IN_PROGRESS' | 'COMPLETED';
    positions: Record<string, DebatePosition[]>;
    result: DebateResult | null;
    rules?: any;
    createdAt: Date;
    updatedAt: Date;
}
export declare class DebateService {
    private readonly logger;
    private debates;
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
    private simpleEvaluation;
    /**
     * Facilitate multi-round debate
     */
    facilitateMultiRoundDebate(topic: string, participants: string[], rounds?: number): Promise<DebateResult>;
    /**
     * Get debate by ID
     */
    getDebate(debateId: string): Promise<Debate | undefined>;
}
//# sourceMappingURL=debate.service.d.ts.map