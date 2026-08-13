export interface ProgressivePromptBridge {
  findElements(): { isReady: boolean };
  sendMessage(text: string): Promise<boolean>;
  isStreaming?(): boolean;
  getLastResponse?(): string | null;
}

export interface ProgressiveDisclosureStep {
  id: string;
  label: string;
  prompt: string;
}

export interface ProgressiveDisclosureSequencerOptions {
  idleThresholdMs?: number;
  minPromptIntervalMs?: number;
  maxPromptsPerConversation?: number;
  prefix?: string;
  steps?: ProgressiveDisclosureStep[];
  now?: () => number;
  log?: Pick<Console, 'log' | 'warn'>;
}

export interface ProgressiveDisclosureSequencerStatus {
  enabled: boolean;
  activeConversation: boolean;
  currentStep: ProgressiveDisclosureStep;
  currentStepIndex: number;
  totalSteps: number;
  promptsSent: number;
  awaitingResponse: boolean;
  lastActivityAt: number;
  lastPromptAt: number;
  blockedReason: string | null;
}

export const DEFAULT_PROGRESSIVE_DISCLOSURE_STEPS: ProgressiveDisclosureStep[] = [
  {
    id: 'orient',
    label: 'Orient',
    prompt:
      'Restate the current objective, identify the single next checkpoint, and stop after that checkpoint is clear.',
  },
  {
    id: 'inspect',
    label: 'Inspect',
    prompt:
      'Inspect the current state needed for that checkpoint. Use concrete evidence from the page, tool output, or conversation state before deciding.',
  },
  {
    id: 'act',
    label: 'Act',
    prompt:
      'Take the smallest useful next action for the checkpoint. Keep it bounded, and call out any assumption that affects the action.',
  },
  {
    id: 'verify',
    label: 'Verify',
    prompt:
      'Verify whether the action worked using observable state. If it did not work, give the next changed attempt instead of repeating the same action.',
  },
  {
    id: 'handoff',
    label: 'Handoff',
    prompt:
      'Summarize what changed, what remains uncertain, and the next concrete action for the workflow.',
  },
];

export class ProgressiveDisclosureSequencer {
  private readonly bridge: ProgressivePromptBridge;
  private readonly idleThresholdMs: number;
  private readonly minPromptIntervalMs: number;
  private readonly maxPromptsPerConversation: number;
  private readonly prefix: string;
  private readonly now: () => number;
  private readonly log: Pick<Console, 'log' | 'warn'>;
  private steps: ProgressiveDisclosureStep[];

  private lastActivityAt: number;
  private lastPromptAt = 0;
  private enabled = false;
  private activeConversation = false;
  private currentStepIndex = 0;
  private promptsSent = 0;
  private awaitingResponse = false;
  private responseSnapshot: string | null = null;
  private inFlight = false;

  constructor(bridge: ProgressivePromptBridge, options: ProgressiveDisclosureSequencerOptions = {}) {
    this.bridge = bridge;
    this.idleThresholdMs = options.idleThresholdMs ?? 45000;
    this.minPromptIntervalMs = options.minPromptIntervalMs ?? 60000;
    this.maxPromptsPerConversation = options.maxPromptsPerConversation ?? 8;
    this.prefix = options.prefix ?? 'Auto-Continue';
    this.steps = this.normalizeSteps(options.steps);
    this.now = options.now ?? (() => Date.now());
    this.log = options.log ?? console;
    this.lastActivityAt = this.now();
  }

  public updateActivity(): void {
    this.lastActivityAt = this.now();
    this.activeConversation = true;
    this.refreshResponseGate();
  }

  public enable(): void {
    this.enabled = true;
    this.log.log('[ProgressiveDisclosureSequencer] Progressive auto-continue enabled');
  }

  public disable(): void {
    this.enabled = false;
    this.log.log('[ProgressiveDisclosureSequencer] Progressive auto-continue disabled');
  }

  public checkAndPrompt(): void {
    void this.checkAndPromptAsync();
  }

  public async checkAndPromptAsync(): Promise<boolean> {
    if (this.getBlockedReason()) return false;

    const step = this.getCurrentStep();
    this.inFlight = true;
    this.lastPromptAt = this.now();
    this.responseSnapshot = this.getResponseSnapshot();
    this.log.log('[ProgressiveDisclosureSequencer] Triggering progressive auto-prompt:', step.id);

    try {
      const success = await this.bridge.sendMessage(this.formatPrompt(step));
      if (!success) {
        this.log.warn('[ProgressiveDisclosureSequencer] Failed to send progressive auto-prompt');
        return false;
      }

      this.promptsSent++;
      this.lastActivityAt = this.now();
      this.awaitingResponse = true;
      this.advanceStep();
      this.log.log('[ProgressiveDisclosureSequencer] Progressive auto-prompt sent successfully');
      return true;
    } finally {
      this.inFlight = false;
    }
  }

  public setWorkflowSteps(steps: ProgressiveDisclosureStep[]): void {
    this.steps = this.normalizeSteps(steps);
    this.currentStepIndex = 0;
  }

  public resetConversation(): void {
    this.activeConversation = false;
    this.lastActivityAt = this.now();
    this.lastPromptAt = 0;
    this.currentStepIndex = 0;
    this.promptsSent = 0;
    this.awaitingResponse = false;
    this.responseSnapshot = null;
    this.log.log('[ProgressiveDisclosureSequencer] Conversation reset');
  }

  public getStatus(): ProgressiveDisclosureSequencerStatus {
    return {
      enabled: this.enabled,
      activeConversation: this.activeConversation,
      currentStep: this.getCurrentStep(),
      currentStepIndex: this.currentStepIndex,
      totalSteps: this.steps.length,
      promptsSent: this.promptsSent,
      awaitingResponse: this.awaitingResponse,
      lastActivityAt: this.lastActivityAt,
      lastPromptAt: this.lastPromptAt,
      blockedReason: this.getBlockedReason(),
    };
  }

  private getBlockedReason(): string | null {
    if (!this.enabled) return 'disabled';
    if (!this.activeConversation) return 'no_active_conversation';
    if (this.inFlight) return 'prompt_in_flight';
    if (this.promptsSent >= this.maxPromptsPerConversation) return 'max_prompts_reached';
    if (this.bridge.isStreaming?.()) return 'chat_streaming';
    if (!this.bridge.findElements().isReady) return 'chat_not_ready';

    const now = this.now();
    if (now - this.lastActivityAt < this.idleThresholdMs) return 'idle_threshold_not_met';
    if (this.lastPromptAt > 0 && now - this.lastPromptAt < this.minPromptIntervalMs) {
      return 'prompt_interval_not_met';
    }
    if (!this.refreshResponseGate()) return 'awaiting_response';

    return null;
  }

  private refreshResponseGate(): boolean {
    if (!this.awaitingResponse) return true;
    if (!this.bridge.getLastResponse) {
      this.awaitingResponse = false;
      return true;
    }

    const latestResponse = this.getResponseSnapshot();
    if (latestResponse && latestResponse !== this.responseSnapshot) {
      this.awaitingResponse = false;
      this.responseSnapshot = latestResponse;
      return true;
    }

    return false;
  }

  private formatPrompt(step: ProgressiveDisclosureStep): string {
    return `[${this.prefix}:${step.id}] ${step.label}: ${step.prompt}`;
  }

  private getCurrentStep(): ProgressiveDisclosureStep {
    return this.steps[this.currentStepIndex] || this.steps[0];
  }

  private advanceStep(): void {
    this.currentStepIndex = (this.currentStepIndex + 1) % this.steps.length;
  }

  private getResponseSnapshot(): string | null {
    const response = this.bridge.getLastResponse?.();
    return typeof response === 'string' && response.trim().length > 0 ? response : null;
  }

  private normalizeSteps(steps?: ProgressiveDisclosureStep[]): ProgressiveDisclosureStep[] {
    const normalized = (steps?.length ? steps : DEFAULT_PROGRESSIVE_DISCLOSURE_STEPS)
      .map((step) => ({
        id: String(step.id || '').trim(),
        label: String(step.label || '').trim(),
        prompt: String(step.prompt || '').trim(),
      }))
      .filter((step) => step.id && step.label && step.prompt);

    if (normalized.length === 0) {
      throw new Error('Progressive disclosure sequencer requires at least one valid prompt step.');
    }

    return normalized;
  }
}

export type ProgressivePromptStep = ProgressiveDisclosureStep;
export type ProgressiveSelfPrompterOptions = ProgressiveDisclosureSequencerOptions;
export type ProgressiveSelfPrompterStatus = ProgressiveDisclosureSequencerStatus;
export const DEFAULT_PROGRESSIVE_PROMPT_STEPS = DEFAULT_PROGRESSIVE_DISCLOSURE_STEPS;
export class ProgressiveSelfPrompter extends ProgressiveDisclosureSequencer {}
