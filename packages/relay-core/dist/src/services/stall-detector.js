/**
 * Stall Detector - Detects and recovers stalled conversations
 *
 * Part of the Multi-Agent Orchestration Enhancement
 * @package @the-new-fuse/relay-core
 */
import { EventEmitter } from 'events';
const DEFAULT_CONFIG = {
    stallThresholdMs: 30000, // 30 seconds
    checkIntervalMs: 5000, // 5 seconds
    maxRecoveryAttempts: 3,
    recoveryIntervalMs: 60000, // 60 seconds
    autoRecover: true,
};
export class StallDetector extends EventEmitter {
    constructor(logger, config = {}) {
        super();
        this.conversations = new Map();
        this.checkInterval = null;
        this.recoveryPrompts = [
            '[SYSTEM] The conversation appears to have stalled. Please continue with your next response.',
            '[SYSTEM] Agents, please acknowledge if you are ready to continue or if the task is complete.',
            '[SYSTEM] Auto-continuation: What should be the next step in this conversation?',
            '[SYSTEM] This is an automated check. Please respond or indicate completion.',
        ];
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.logger = logger;
        this.logger.info(`[StallDetector] Initialized with threshold: ${this.config.stallThresholdMs}ms`);
    }
    /**
     * Start monitoring for stalls
     */
    start() {
        if (this.checkInterval) {
            this.logger.warn('[StallDetector] Already running');
            return;
        }
        this.logger.info('[StallDetector] Starting stall monitoring...');
        this.checkInterval = setInterval(() => this.checkForStalls(), this.config.checkIntervalMs);
    }
    /**
     * Stop monitoring
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this.logger.info('[StallDetector] Stopped monitoring');
        }
    }
    /**
     * Track a new conversation or update existing
     */
    trackConversation(channelId, conversationId) {
        const id = conversationId || `conv-${channelId}-${Date.now()}`;
        if (!this.conversations.has(id)) {
            const state = {
                conversationId: id,
                channelId,
                lastActivityAt: Date.now(),
                participants: new Set(),
                messageCount: 0,
                status: 'active',
                createdAt: Date.now(),
                recoveryAttempts: 0,
            };
            this.conversations.set(id, state);
            this.logger.info(`[StallDetector] Tracking new conversation: ${id}`);
        }
        return id;
    }
    /**
     * Record activity on a conversation
     * IMPORTANT: Only creates conversation if one exists or if messageCount will be > 0
     */
    recordActivity(channelId, agentId, hasContent = true) {
        // Find conversation by channel
        for (const [id, state] of this.conversations) {
            if (state.channelId === channelId &&
                (state.status === 'active' || state.status === 'stalled')) {
                const wasStalled = state.status === 'stalled';
                state.lastActivityAt = Date.now();
                // Only increment message count if there's actual content
                if (hasContent) {
                    state.messageCount++;
                }
                state.recoveryAttempts = 0; // Reset recovery attempts on activity
                if (agentId) {
                    state.participants.add(agentId);
                }
                // If was stalled, mark as active again
                if (wasStalled) {
                    this.logger.info(`[StallDetector] Conversation ${id} recovered!`);
                    state.status = 'active';
                    this.emit('conversation:recovered', { conversationId: id, channelId });
                }
                return;
            }
        }
        // CRITICAL FIX: Only create new conversation if there's actual content
        // Don't auto-create conversations from heartbeats or system messages
        if (!hasContent) {
            return;
        }
        // If no existing conversation, create one
        const id = this.trackConversation(channelId);
        if (agentId) {
            this.conversations.get(id).participants.add(agentId);
        }
        this.conversations.get(id).messageCount = 1;
    }
    /**
     * Mark conversation as completed
     */
    completeConversation(channelId) {
        for (const [id, state] of this.conversations) {
            if (state.channelId === channelId && state.status !== 'terminated') {
                state.status = 'completed';
                console.log(`[StallDetector] Conversation ${id} marked as completed`);
                this.emit('conversation:completed', { conversationId: id, channelId });
            }
        }
    }
    /**
     * Check all conversations for stalls
     */
    checkForStalls() {
        const now = Date.now();
        for (const [id, state] of this.conversations) {
            if (state.status !== 'active' && state.status !== 'stalled') {
                continue;
            }
            const idleTime = now - state.lastActivityAt;
            // IMPORTANT: Don't consider conversations with no real messages as stalled
            // They haven't actually started yet - just a channel was created
            if (state.messageCount < 1) {
                continue;
            }
            // CRITICAL FIX: Don't detect stalls if there's only 1 participant (likely just the orchestrator)
            // We need at least 2 participants for a "conversation" to be stall-able
            if (state.participants.size < 2) {
                continue;
            }
            // Check if stalled
            if (idleTime > this.config.stallThresholdMs) {
                if (state.status === 'active') {
                    // Just became stalled
                    state.status = 'stalled';
                    this.logger.warn(`[StallDetector] Conversation ${id} stalled (idle: ${idleTime}ms, messages: ${state.messageCount})`);
                }
                // Check if we should attempt recovery
                if (this.config.autoRecover && state.recoveryAttempts < this.config.maxRecoveryAttempts) {
                    // Check if enough time has passed since last recovery attempt
                    const lastAttemptTime = state.lastActivityAt; // Approximation
                    const timeSinceLastAttempt = now - lastAttemptTime;
                    if (timeSinceLastAttempt >= this.config.recoveryIntervalMs * state.recoveryAttempts) {
                        state.recoveryAttempts++;
                        this.attemptRecovery(state);
                    }
                }
                else if (state.recoveryAttempts >= this.config.maxRecoveryAttempts) {
                    // Max recovery attempts reached
                    this.logger.error(`[StallDetector] Conversation ${id} terminated after ${state.recoveryAttempts} recovery attempts`);
                    state.status = 'terminated';
                    this.emit('conversation:terminated', {
                        conversationId: id,
                        channelId: state.channelId,
                        reason: 'max_recovery_attempts_exceeded',
                    });
                }
            }
        }
    }
    /**
     * Attempt to recover a stalled conversation
     */
    attemptRecovery(state) {
        const event = {
            conversationId: state.conversationId,
            channelId: state.channelId,
            participants: Array.from(state.participants),
            lastActivityAt: state.lastActivityAt,
            messageCount: state.messageCount,
            idleTimeMs: Date.now() - state.lastActivityAt,
            recoveryAttempt: state.recoveryAttempts,
        };
        this.logger.warn(`[StallDetector] Recovery attempt ${state.recoveryAttempts} for conversation ${state.conversationId}`);
        // Emit event for relay to handle
        this.emit('conversation:stalled', event);
        // Select recovery prompt based on attempt number
        const promptIndex = (state.recoveryAttempts - 1) % this.recoveryPrompts.length;
        const recoveryPrompt = this.recoveryPrompts[promptIndex];
        // Emit recovery message request
        this.emit('recovery:message', {
            channelId: state.channelId,
            message: recoveryPrompt,
            metadata: {
                isSystemMessage: true,
                isRecoveryAttempt: true,
                attemptNumber: state.recoveryAttempts,
                conversationId: state.conversationId,
            },
        });
    }
    /**
     * Get conversation state
     */
    getConversationState(conversationId) {
        return this.conversations.get(conversationId);
    }
    /**
     * Get all active/stalled conversations
     */
    getActiveConversations() {
        return Array.from(this.conversations.values()).filter((s) => s.status === 'active' || s.status === 'stalled');
    }
    /**
     * Get statistics
     */
    getStats() {
        let active = 0, stalled = 0, completed = 0, terminated = 0, recoveryAttempts = 0;
        for (const state of this.conversations.values()) {
            switch (state.status) {
                case 'active':
                    active++;
                    break;
                case 'stalled':
                    stalled++;
                    break;
                case 'completed':
                    completed++;
                    break;
                case 'terminated':
                    terminated++;
                    break;
            }
            recoveryAttempts += state.recoveryAttempts;
        }
        return {
            total: this.conversations.size,
            active,
            stalled,
            completed,
            terminated,
            totalRecoveryAttempts: recoveryAttempts,
        };
    }
    /**
     * Cleanup old conversations
     */
    cleanup(maxAgeMs = 3600000) {
        // Default: 1 hour
        const now = Date.now();
        let cleaned = 0;
        for (const [id, state] of this.conversations) {
            if (now - state.createdAt > maxAgeMs) {
                if (state.status === 'completed' || state.status === 'terminated') {
                    this.conversations.delete(id);
                    cleaned++;
                }
            }
        }
        if (cleaned > 0) {
            this.logger.info(`[StallDetector] Cleaned up ${cleaned} old conversations`);
        }
        return cleaned;
    }
}
export function createStallDetector(logger, config) {
    return new StallDetector(logger, config);
}
//# sourceMappingURL=stall-detector.js.map