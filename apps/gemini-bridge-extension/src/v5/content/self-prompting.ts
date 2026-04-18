import { simpleChatBridge } from './adapters/SimpleChatBridge.js';

export class SelfPrompter {
  private readonly IDLE_THRESHOLD_MS = 45000; // 45 seconds
  private lastActivity: number = Date.now();
  private isEnabled: boolean = false; // DISABLED by default - user must explicitly enable
  private hasActiveConversation: boolean = false;
  private lastPromptTime: number = 0;
  private readonly MIN_PROMPT_INTERVAL_MS = 60000; // Minimum 60s between prompts

  private prompts = [
    'Please continue with the conversation.',
    'What are your thoughts on what was discussed?',
    'Is there anything else to add to this topic?',
    'Please summarize the key points so far.',
    'What should be the next step?',
  ];

  public updateActivity(): void {
    this.lastActivity = Date.now();
    this.hasActiveConversation = true;
  }

  public enable(): void {
    this.isEnabled = true;
    console.log('[SelfPrompter] Auto-continue enabled');
  }

  public disable(): void {
    this.isEnabled = false;
    console.log('[SelfPrompter] Auto-continue disabled');
  }

  public checkAndPrompt(): void {
    if (!this.isEnabled) return;
    if (!this.hasActiveConversation) return; // Don't prompt if no conversation started

    const idleTime = Date.now() - this.lastActivity;
    const timeSinceLastPrompt = Date.now() - this.lastPromptTime;

    // Only prompt if:
    // 1. Idle threshold exceeded
    // 2. Minimum interval since last prompt has passed
    // 3. Chat elements are ready
    if (
      idleTime > this.IDLE_THRESHOLD_MS &&
      timeSinceLastPrompt > this.MIN_PROMPT_INTERVAL_MS &&
      simpleChatBridge.findElements().isReady
    ) {
      const prompt = this.selectPrompt();
      this.injectPrompt(prompt);
    }
  }

  private selectPrompt(): string {
    return this.prompts[Math.floor(Math.random() * this.prompts.length)];
  }

  private async injectPrompt(prompt: string): Promise<void> {
    console.log('[SelfPrompter] Triggering auto-prompt:', prompt);
    this.lastPromptTime = Date.now();

    // Use SimpleChatBridge to inject
    const success = await simpleChatBridge.sendMessage(`[Auto-Continue] ${prompt}`);

    if (success) {
      this.lastActivity = Date.now();
      console.log('[SelfPrompter] Auto-prompt sent successfully');
    } else {
      console.warn('[SelfPrompter] Failed to send auto-prompt');
    }
  }

  public resetConversation(): void {
    this.hasActiveConversation = false;
    this.lastActivity = Date.now();
    this.lastPromptTime = 0;
    console.log('[SelfPrompter] Conversation reset');
  }
}
