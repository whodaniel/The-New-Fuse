import { EventEmitter } from 'node:events'; // eslint-disable-line import/no-unresolved

export enum ConversationPhase {
  INITIALIZING = 'initializing',
  AGENT_DISCOVERY = 'agent_discovery',
  TASK_ASSIGNMENT = 'task_assignment',
  EXECUTION = 'execution',
  REVIEW = 'review',
  COMPLETION = 'completion',
  STALLED = 'stalled',
  RECOVERY = 'recovery',
  TERMINATED = 'terminated',
  PAUSED = 'paused',
}

export interface ConversationConfig {
  maxDuration: number; // Max conversation duration
  phaseTimeouts: Record<ConversationPhase, number>;
  autoAdvance: boolean; // Auto-advance phases on timeout
  requireHumanApproval: boolean; // Human checkpoint
}

export class ConversationStateMachine extends EventEmitter {
  private phase: ConversationPhase = ConversationPhase.INITIALIZING;
  private phaseStartedAt: number;
  private config: ConversationConfig;
  private lastActivityAt: number;

  private channelId: string;

  constructor(channelId: string, config?: Partial<ConversationConfig>) {
    super();
    this.channelId = channelId;
    this.config = {
      maxDuration: config?.maxDuration || 3600000, // 1 hour
      phaseTimeouts: config?.phaseTimeouts || {
        [ConversationPhase.INITIALIZING]: 60000,
        [ConversationPhase.AGENT_DISCOVERY]: 60000,
        [ConversationPhase.TASK_ASSIGNMENT]: 60000,
        [ConversationPhase.EXECUTION]: 3600000,
        [ConversationPhase.REVIEW]: 3600000,
        [ConversationPhase.COMPLETION]: 3600000,
        [ConversationPhase.STALLED]: 3600000,
        [ConversationPhase.RECOVERY]: 3600000,
        [ConversationPhase.TERMINATED]: 0,
        [ConversationPhase.PAUSED]: 0,
      },
      autoAdvance: config?.autoAdvance ?? true,
      requireHumanApproval: config?.requireHumanApproval ?? false,
    };
    this.phaseStartedAt = Date.now();
    this.lastActivityAt = Date.now();
  }

  public get currentPhase(): ConversationPhase {
    return this.phase;
  }

  public getPhase(): ConversationPhase {
    return this.phase;
  }

  public get durationInPhase(): number {
    return Date.now() - this.phaseStartedAt;
  }

  public recordActivity(): void {
    this.lastActivityAt = Date.now();
  }

  public async pause(): Promise<void> {
    if (this.phase === ConversationPhase.PAUSED) {
      return;
    }
    await this.transition(ConversationPhase.PAUSED);
  }

  public async resume(): Promise<void> {
    if (this.phase !== ConversationPhase.PAUSED) {
      return;
    }
    // Resume to EXECUTION by default or logic to determine previous phase
    await this.transition(ConversationPhase.EXECUTION);
  }

  async transition(newPhase: ConversationPhase): Promise<void> {
    if (this.phase === newPhase) {
      return;
    }

    // console.log(`[Conversation] ${this.phase} -> ${newPhase}`);

    // Exit actions
    await this.exitPhase(this.phase);

    // Transition
    const oldPhase = this.phase;
    this.phase = newPhase;
    this.phaseStartedAt = Date.now();

    this.emit('phase:changed', {
      from: oldPhase,
      to: newPhase,
      timestamp: this.phaseStartedAt,
      conversationId: this.channelId,
    });

    // Entry actions
    await this.enterPhase(newPhase);
  }

  private async exitPhase(_phase: ConversationPhase): Promise<void> {
    // Logic for cleanup when leaving a phase
    // console.log(`[Conversation] Exiting phase: ${phase}`);
  }

  private async enterPhase(phase: ConversationPhase): Promise<void> {
    // console.log(`[Conversation] Entering phase: ${phase}`);
    switch (phase) {
      case ConversationPhase.STALLED:
        await this.handleStallEntry();
        break;
      case ConversationPhase.RECOVERY:
        await this.handleRecoveryEntry();
        break;
      case ConversationPhase.INITIALIZING:
      case ConversationPhase.AGENT_DISCOVERY:
      case ConversationPhase.TASK_ASSIGNMENT:
      case ConversationPhase.EXECUTION:
      case ConversationPhase.REVIEW:
      case ConversationPhase.COMPLETION:
      case ConversationPhase.TERMINATED:
      case ConversationPhase.PAUSED:
        // Default entry logic if any
        break;
    }
  }

  private async handleStallEntry(): Promise<void> {
    // console.log('[Conversation] Handling stall entry...');
    // Additional logic can be added here
  }

  private async handleRecoveryEntry(): Promise<void> {
    // console.log('[Conversation] Handling recovery entry...');
    // Additional logic can be added here
  }
}
