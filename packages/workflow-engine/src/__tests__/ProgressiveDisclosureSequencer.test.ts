import {
  ProgressiveDisclosureSequencer,
  type ProgressivePromptBridge,
} from '../sequencer/ProgressiveDisclosureSequencer';

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

describe('ProgressiveDisclosureSequencer', () => {
  const silentLog = {
    log: jest.fn(),
    warn: jest.fn(),
  };

  let now: number;
  let bridge: FakeBridge;
  let sequencer: ProgressiveDisclosureSequencer;

  beforeEach(() => {
    now = 1000;
    bridge = new FakeBridge();
    silentLog.log.mockClear();
    silentLog.warn.mockClear();
    sequencer = new ProgressiveDisclosureSequencer(bridge, {
      idleThresholdMs: 100,
      minPromptIntervalMs: 50,
      maxPromptsPerConversation: 3,
      now: () => now,
      log: silentLog,
    });
  });

  it('requires explicit enablement and active conversation state', async () => {
    now += 200;
    expect(await sequencer.checkAndPromptAsync()).toBe(false);

    sequencer.enable();
    expect(await sequencer.checkAndPromptAsync()).toBe(false);
    expect(bridge.sent).toHaveLength(0);
    expect(sequencer.getStatus().blockedReason).toBe('no_active_conversation');
  });

  it('advances deterministic disclosure stages only after response changes', async () => {
    sequencer.enable();
    sequencer.updateActivity();
    now += 101;

    expect(await sequencer.checkAndPromptAsync()).toBe(true);
    expect(bridge.sent[0]).toContain('[Auto-Continue:orient] Orient:');
    expect(sequencer.getStatus().currentStep.id).toBe('inspect');

    now += 101;
    expect(await sequencer.checkAndPromptAsync()).toBe(false);
    expect(sequencer.getStatus().blockedReason).toBe('awaiting_response');

    bridge.response = 'changed response';
    now += 101;
    expect(await sequencer.checkAndPromptAsync()).toBe(true);
    expect(bridge.sent[1]).toContain('[Auto-Continue:inspect] Inspect:');
  });

  it('blocks while streaming and caps prompt count per conversation', async () => {
    sequencer.enable();
    sequencer.updateActivity();
    bridge.streaming = true;
    now += 101;
    expect(await sequencer.checkAndPromptAsync()).toBe(false);
    expect(sequencer.getStatus().blockedReason).toBe('chat_streaming');

    bridge.streaming = false;
    for (let i = 0; i < 3; i++) {
      bridge.response = `response ${i}`;
      now += 101;
      expect(await sequencer.checkAndPromptAsync()).toBe(true);
    }

    bridge.response = 'response 4';
    now += 101;
    expect(await sequencer.checkAndPromptAsync()).toBe(false);
    expect(sequencer.getStatus().blockedReason).toBe('max_prompts_reached');
  });

  it('supports custom steps and validates normalized step sets', async () => {
    sequencer.enable();
    sequencer.updateActivity();
    sequencer.setWorkflowSteps([{ id: 'core', label: 'Core', prompt: 'Use core sequencing.' }]);
    now += 101;

    expect(await sequencer.checkAndPromptAsync()).toBe(true);
    expect(bridge.sent[0]).toContain('[Auto-Continue:core] Core: Use core sequencing.');

    expect(() => sequencer.setWorkflowSteps([{ id: '', label: '', prompt: '' }])).toThrow(
      'Progressive disclosure sequencer requires at least one valid prompt step.'
    );
  });

  it('does not advance when prompt delivery fails', async () => {
    sequencer.enable();
    sequencer.updateActivity();
    bridge.sendSucceeds = false;
    now += 101;

    expect(await sequencer.checkAndPromptAsync()).toBe(false);
    expect(bridge.sent).toHaveLength(1);
    expect(sequencer.getStatus()).toMatchObject({
      promptsSent: 0,
      currentStepIndex: 0,
      awaitingResponse: false,
    });
  });
});
