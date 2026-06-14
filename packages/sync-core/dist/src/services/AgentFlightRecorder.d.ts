import { EventEmitter } from 'events';
export interface AgentAction {
    timestamp: number;
    agentId: string;
    actionType: string;
    target?: string;
    details?: Record<string, any>;
}
export interface AgentSessionRecord {
    sessionId: string;
    agentId: string;
    startTime: number;
    endTime?: number;
    actions: AgentAction[];
    metadata: Record<string, any>;
}
/**
 * AgentFlightRecorder
 *
 * Provides telemetry and behavioral analysis recording for agents.
 * Records session actions, state snapshots,
 * and errors for debugging and analyzing agent behavior.
 */
export declare class AgentFlightRecorder extends EventEmitter {
    private activeSessions;
    private recordStoragePath;
    constructor(storagePath?: string);
    /**
     * Start a new recording session
     */
    startSession(agentId: string, metadata?: Record<string, any>): string;
    /**
     * Record an action in the current session
     */
    recordAction(sessionId: string, actionType: string, target?: string, details?: Record<string, any>): void;
    /**
     * End a recording session and save it
     */
    endSession(sessionId: string): Promise<AgentSessionRecord | null>;
    /**
     * Get an active session's current record
     */
    getActiveSession(sessionId: string): AgentSessionRecord | undefined;
}
//# sourceMappingURL=AgentFlightRecorder.d.ts.map