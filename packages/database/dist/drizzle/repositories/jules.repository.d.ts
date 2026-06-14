import type { JulesConfig, JulesSession, JulesUsageLog, NewJulesConfig, NewJulesSession, NewJulesUsageLog } from '../types/jules.js';
/**
 * Jules Repository - provides data access for Jules-related entities
 */
export declare class DrizzleJulesRepository {
    /**
     * Create a new Jules configuration
     */
    createConfig(data: NewJulesConfig): Promise<JulesConfig>;
    /**
     * Find Jules config by user ID
     */
    findConfigByUserId(userId: string): Promise<JulesConfig | null>;
    /**
     * Update Jules configuration
     */
    updateConfig(id: string, data: Partial<Omit<JulesConfig, 'id' | 'createdAt'>>): Promise<JulesConfig | null>;
    /**
     * Create a new Jules session
     */
    createSession(data: NewJulesSession): Promise<JulesSession>;
    /**
     * Find Jules session by Jules session ID
     */
    findSessionByJulesSessionId(julesSessionId: string): Promise<JulesSession | null>;
    /**
     * Find Jules session by task ID
     */
    findSessionByTaskId(taskId: string): Promise<JulesSession | null>;
    /**
     * Find all sessions for a user
     */
    findSessionsByUserId(userId: string): Promise<JulesSession[]>;
    /**
     * Update Jules session
     */
    updateSession(id: string, data: Partial<Omit<JulesSession, 'id' | 'createdAt'>>): Promise<JulesSession | null>;
    /**
     * Update Jules session by Jules session ID
     */
    updateSessionByJulesSessionId(julesSessionId: string, data: Partial<Omit<JulesSession, 'id' | 'createdAt' | 'julesSessionId'>>): Promise<JulesSession | null>;
    /**
     * Create a new usage log entry
     */
    createUsageLog(data: NewJulesUsageLog): Promise<JulesUsageLog>;
    /**
     * Find usage logs for a session
     */
    findUsageLogsBySessionId(sessionId: string): Promise<JulesUsageLog[]>;
    /**
     * Find usage logs for a user
     */
    findUsageLogsByUserId(userId: string): Promise<JulesUsageLog[]>;
    /**
     * Update usage log
     */
    updateUsageLog(id: string, data: Partial<Omit<JulesUsageLog, 'id' | 'createdAt'>>): Promise<JulesUsageLog | null>;
}
export declare const drizzleJulesRepository: DrizzleJulesRepository;
//# sourceMappingURL=jules.repository.d.ts.map