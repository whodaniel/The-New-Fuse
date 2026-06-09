import {
  ProgressivePromptBridge,
  ProgressiveSelfPrompter,
} from '../progressive-self-prompter';

class FakeBridge implements ProgressivePromptBridge {
  public ready = true;
  public streaming = false;
  public response: string | null = null;
  public sendSucceeds = true;
  public sent: string[] = [];

  findElements(): { isReady: boolean } {
    return { isReady: this.ready };
  }

  async sendMessage(text: string): Promise<boolean> {
    this.sent.push(text);
    return this.sendSucceeds;
  }

  isStreaming(): boolean {
    return this.streaming;
  }

  getLastResponse(): string | null {
    return this.response;
  }
}

describe('ProgressiveSelfPrompter', () => {
  let now: number;
  let bridge: FakeBridge;
  let prompter: ProgressiveSelfPrompter;
  let logSpy: jest.SpiedFunction<typeof console.log>;
  let warnSpy: jest.SpiedFunction<typeof console.warn>;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    now = 1000;
    bridge = new FakeBridge();
    prompter = new ProgressiveSelfPrompter(bridge, {
      idleThresholdMs: 100,
      minPromptIntervalMs: 50,
      maxPromptsPerConversation: 3,
      now: () => now,
    });
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('does not prompt until explicitly enabled and active', async () => {
    now += 200;
    expect(await prompter.checkAndPromptAsync()).toBe(false);

    prompter.enable();
    expect(await prompter.checkAndPromptAsync()).toBe(false);

    expect(bridge.sent).toHaveLength(0);
    expect(prompter.getStatus().blockedReason).toBe('no_active_conversation');
  });

  it('sends deterministic progressive stages after idle threshold', async () => {
    prompter.enable();
    prompter.updateActivity();
    now += 101;

    expect(await prompter.checkAndPromptAsync()).toBe(true);
    expect(bridge.sent[0]).toContain('[Auto-Continue:orient] Orient:');
    expect(prompter.getStatus().currentStep.id).toBe('inspect');

    bridge.response = 'first model response';
    now += 101;

    expect(await prompter.checkAndPromptAsync()).toBe(true);
    expect(bridge.sent[1]).toContain('[Auto-Continue:inspect] Inspect:');
    expect(prompter.getStatus().currentStep.id).toBe('act');
  });

  it('waits for a changed response before advancing the next prompt', async () => {
    prompter.enable();
    prompter.updateActivity();
    now += 101;

    expect(await prompter.checkAndPromptAsync()).toBe(true);
    now += 101;

    expect(await prompter.checkAndPromptAsync()).toBe(false);
    expect(bridge.sent).toHaveLength(1);
    expect(prompter.getStatus().blockedReason).toBe('awaiting_response');
  });

  it('does not prompt while the chat is streaming', async () => {
    prompter.enable();
    prompter.updateActivity();
    bridge.streaming = true;
    now += 101;

    expect(await prompter.checkAndPromptAsync()).toBe(false);
    expect(bridge.sent).toHaveLength(0);
    expect(prompter.getStatus().blockedReason).toBe('chat_streaming');
  });

  it('caps prompts per conversation', async () => {
    prompter.enable();
    prompter.updateActivity();

    for (let i = 0; i < 3; i++) {
      now += 101;
      bridge.response = `response ${i}`;
      expect(await prompter.checkAndPromptAsync()).toBe(true);
    }

    now += 101;
    bridge.response = 'response 4';
    expect(await prompter.checkAndPromptAsync()).toBe(false);
    expect(prompter.getStatus().blockedReason).toBe('max_prompts_reached');
  });

  it('supports custom workflow steps, reset, and disable controls', async () => {
    prompter.enable();
    prompter.updateActivity();
    prompter.setWorkflowSteps([
      {
        id: 'custom',
        label: 'Custom',
        prompt: 'Use the custom step.',
      },
    ]);
    now += 101;

    expect(await prompter.checkAndPromptAsync()).toBe(true);
    expect(bridge.sent[0]).toContain('[Auto-Continue:custom] Custom: Use the custom step.');

    prompter.resetConversation();
    expect(prompter.getStatus()).toMatchObject({
      activeConversation: false,
      promptsSent: 0,
      currentStepIndex: 0,
      awaitingResponse: false,
    });

    prompter.disable();
    expect(prompter.getStatus().blockedReason).toBe('disabled');
  });

  it('does not advance when prompt delivery fails', async () => {
    prompter.enable();
    prompter.updateActivity();
    bridge.sendSucceeds = false;
    now += 101;

    expect(await prompter.checkAndPromptAsync()).toBe(false);
    expect(bridge.sent).toHaveLength(1);
    expect(prompter.getStatus()).toMatchObject({
      promptsSent: 0,
      currentStepIndex: 0,
      awaitingResponse: false,
    });
  });

  it('rejects workflow step sets with no valid steps', () => {
    expect(() => prompter.setWorkflowSteps([{ id: '', label: '', prompt: '' }])).toThrow(
      'Progressive disclosure sequencer requires at least one valid prompt step.'
    );
  });
});
