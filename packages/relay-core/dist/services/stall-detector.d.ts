/**
 * Stall Detector - Detects and recovers stalled conversations
 *
 * Part of the Multi-Agent Orchestration Enhancement
 * @package @the-new-fuse/relay-core
 */
import { EventEmitter } from 'events';
export interface ConversationState {
    conversationId: string;
    channelId: string;
    lastActivityAt: number;
    participants: Set<string>;
    messageCount: number;
    status: 'active' | 'stalled' | 'completed' | 'terminated';
    createdAt: number;
    recoveryAttempts: number;
}
export interface StallEvent {
    conversationId: string;
    channelId: string;
    participants: string[];
    lastActivityAt: number;
    messageCount: number;
    idleTimeMs: number;
    recoveryAttempt: number;
}
export interface StallDetectorConfig {
    stallThresholdMs: number;
    checkIntervalMs: number;
    maxRecoveryAttempts: number;
    recoveryIntervalMs: number;
    autoRecover: boolean;
}
export declare class StallDetector extends EventEmitter {
    private conversations;
    private config;
    private checkInterval;
    private recoveryPrompts;
    constructor(config?: Partial<StallDetectorConfig>);
    /**
     * Start monitoring for stalls
     */
    start(): void;
    /**
     * Stop monitoring
     */
    stop(): void;
    /**
     * Track a new conversation or update existing
     */
    trackConversation(channelId: string, conversationId?: string): string;
    /**
     * Record activity on a conversation
     * IMPORTANT: Only creates conversation if one exists or if messageCount will be > 0
     */
    recordActivity(channelId: string, agentId?: string, hasContent?: boolean): void;
    /**
     * Mark conversation as completed
     */
    completeConversation(channelId: string): void;
    /**
     * Check all conversations for stalls
     */
    private checkForStalls;
    /**
     * Attempt to recover a stalled conversation
     */
    private attemptRecovery;
    /**
     * Get conversation state
     */
    getConversationState(conversationId: string): ConversationState | undefined;
    /**
     * Get all active/stalled conversations
     */
    getActiveConversations(): ConversationState[];
    /**
     * Get statistics
     */
    getStats(): {
        total: number;
        active: number;
        stalled: number;
        completed: number;
        terminated: number;
        totalRecoveryAttempts: number;
    };
    /**
     * Cleanup old conversations
     */
    cleanup(maxAgeMs?: number): number;
}
export declare function createStallDetector(config?: Partial<StallDetectorConfig>): StallDetector;
//# sourceMappingURL=stall-detector.d.ts.map