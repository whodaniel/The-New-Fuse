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
  stallThresholdMs: number; // How long before considered stalled (default: 30s)
  checkIntervalMs: number; // How often to check (default: 5s)
  maxRecoveryAttempts: number; // Max recovery attempts before giving up (default: 3)
  recoveryIntervalMs: number; // Time between recovery attempts (default: 60s)
  autoRecover: boolean; // Automatically send wake-up messages (default: true)
}

const DEFAULT_CONFIG: StallDetectorConfig = {
  stallThresholdMs: 30000, // 30 seconds
  checkIntervalMs: 5000, // 5 seconds
  maxRecoveryAttempts: 3,
  recoveryIntervalMs: 60000, // 60 seconds
  autoRecover: true,
};

export class StallDetector extends EventEmitter {
  private conversations: Map<string, ConversationState> = new Map();
  private config: StallDetectorConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private recoveryPrompts: string[] = [
    '[SYSTEM] The conversation appears to have stalled. Please continue with your next response.',
    '[SYSTEM] Agents, please acknowledge if you are ready to continue or if the task is complete.',
    '[SYSTEM] Auto-continuation: What should be the next step in this conversation?',
    '[SYSTEM] This is an automated check. Please respond or indicate completion.',
  ];

  constructor(config: Partial<StallDetectorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('[StallDetector] Initialized with config:', this.config);
  }

  /**
   * Start monitoring for stalls
   */
  start(): void {
    if (this.checkInterval) {
      console.warn('[StallDetector] Already running');
      return;
    }

    console.log('[StallDetector] Starting stall monitoring...');
    this.checkInterval = setInterval(() => this.checkForStalls(), this.config.checkIntervalMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[StallDetector] Stopped monitoring');
    }
  }

  /**
   * Track a new conversation or update existing
   */
  trackConversation(channelId: string, conversationId?: string): string {
    const id = conversationId || `conv-${channelId}-${Date.now()}`;

    if (!this.conversations.has(id)) {
      const state: ConversationState = {
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
      console.log(`[StallDetector] Tracking new conversation: ${id}`);
    }

    return id;
  }

  /**
   * Record activity on a conversation
   * IMPORTANT: Only creates conversation if one exists or if messageCount will be > 0
   */
  recordActivity(channelId: string, agentId?: string, hasContent: boolean = true): void {
    // Find conversation by channel
    for (const [id, state] of this.conversations) {
      if (
        state.channelId === channelId &&
        (state.status === 'active' || state.status === 'stalled')
      ) {
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
          console.log(`[StallDetector] Conversation ${id} recovered!`);
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
      this.conversations.get(id)!.participants.add(agentId);
    }
    this.conversations.get(id)!.messageCount = 1;
  }

  /**
   * Mark conversation as completed
   */
  completeConversation(channelId: string): void {
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
  private checkForStalls(): void {
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
          console.log(
            `[StallDetector] Conversation ${id} stalled (idle: ${idleTime}ms, messages: ${state.messageCount})`
          );
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
        } else if (state.recoveryAttempts >= this.config.maxRecoveryAttempts) {
          // Max recovery attempts reached
          console.log(
            `[StallDetector] Conversation ${id} terminated after ${state.recoveryAttempts} recovery attempts`
          );
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
  private attemptRecovery(state: ConversationState): void {
    const event: StallEvent = {
      conversationId: state.conversationId,
      channelId: state.channelId,
      participants: Array.from(state.participants),
      lastActivityAt: state.lastActivityAt,
      messageCount: state.messageCount,
      idleTimeMs: Date.now() - state.lastActivityAt,
      recoveryAttempt: state.recoveryAttempts,
    };

    console.log(
      `[StallDetector] Recovery attempt ${state.recoveryAttempts} for conversation ${state.conversationId}`
    );

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
  getConversationState(conversationId: string): ConversationState | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Get all active/stalled conversations
   */
  getActiveConversations(): ConversationState[] {
    return Array.from(this.conversations.values()).filter(
      (s) => s.status === 'active' || s.status === 'stalled'
    );
  }

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
  } {
    let active = 0,
      stalled = 0,
      completed = 0,
      terminated = 0,
      recoveryAttempts = 0;

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
  cleanup(maxAgeMs: number = 3600000): number {
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
      console.log(`[StallDetector] Cleaned up ${cleaned} old conversations`);
    }

    return cleaned;
  }
}

export function createStallDetector(config?: Partial<StallDetectorConfig>): StallDetector {
  return new StallDetector(config);
}
