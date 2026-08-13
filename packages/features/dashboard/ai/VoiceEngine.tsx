interface VoiceCommand {
  type: 'navigation' | 'action' | 'query' | 'control';
  intent: string;
  parameters: Record<string, unknown>;
  confidence: number;
  raw: string;
}

interface CommandHandler {
  type: VoiceCommand['type'];
  pattern: RegExp;
  handler: (command: VoiceCommand) => Promise<void>;
}

interface NLPEngineLike {
  processQuery?: (
    query: string,
    context: Record<string, unknown> | null
  ) => Promise<{
    query?: {
      intent?: string;
      parameters?: Record<string, unknown>;
      confidence?: number;
      type?: string;
    };
  }>;
}

type RecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult?: ((event: any) => void) | null;
  onerror?: ((event: any) => void) | null;
  onend?: (() => void) | null;
};

export class VoiceEngine {
  private nlpEngine: NLPEngineLike;
  private recognition: InstanceType<RecognitionCtor> | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private commandHandlers: CommandHandler[] = [];
  private commandHistory: VoiceCommand[] = [];
  private contextState: Record<string, unknown> | null = null;

  constructor(nlpEngine: NLPEngineLike) {
    this.nlpEngine = nlpEngine;
    this.initializeSpeechApi();
  }

  private initializeSpeechApi(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.onresult = async (event: any) => {
        const idx = event?.results?.length ? event.results.length - 1 : 0;
        const transcript = event?.results?.[idx]?.[0]?.transcript;
        if (typeof transcript === 'string' && transcript.trim()) {
          await this.processCommand(transcript.trim());
        }
      };
      this.recognition.onerror = async () => {
        await this.speak('Please enable microphone access.');
      };
      this.recognition.onend = () => {
        if (this.isListening) {
          this.recognition?.start();
        }
      };
    }

    if (typeof window.speechSynthesis !== 'undefined') {
      this.synthesis = window.speechSynthesis;
    }

    this.registerDefaultHandlers();
  }

  setContextState(state: Record<string, unknown> | null): void {
    this.contextState = state;
  }

  startListening(): void {
    if (!this.recognition || this.isListening) {
      return;
    }
    this.isListening = true;
    this.recognition.start();
  }

  stopListening(): void {
    if (!this.recognition || !this.isListening) {
      return;
    }
    this.isListening = false;
    this.recognition.stop();
  }

  addCommandHandler(handler: CommandHandler): void {
    this.commandHandlers.push(handler);
  }

  async processCommand(text: string): Promise<VoiceCommand | null> {
    const normalizedText = text.trim().toLowerCase();
    if (!normalizedText || !this.isWakeWordDetected(normalizedText)) {
      return null;
    }

    let inferredType: VoiceCommand['type'] = 'action';
    if (normalizedText.includes('navigate') || normalizedText.includes('open ')) {
      inferredType = 'navigation';
    } else if (normalizedText.includes('search') || normalizedText.includes('find')) {
      inferredType = 'query';
    } else if (normalizedText.includes('toggle') || normalizedText.includes('set ')) {
      inferredType = 'control';
    }

    const nlpResult = await this.nlpEngine.processQuery?.(normalizedText, this.contextState);
    const command: VoiceCommand = {
      type: (nlpResult?.query?.type as VoiceCommand['type']) || inferredType,
      intent: nlpResult?.query?.intent || inferredType,
      parameters: nlpResult?.query?.parameters || {},
      confidence: nlpResult?.query?.confidence || 0.7,
      raw: text,
    };

    this.commandHistory.push(command);
    await this.executeCommand(command);
    return command;
  }

  async speak(text: string): Promise<void> {
    if (!this.synthesis || !text.trim()) {
      return;
    }
    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      this.synthesis?.cancel();
      this.synthesis?.speak(utterance);
    });
  }

  getHistory(limit = 50): VoiceCommand[] {
    if (limit <= 0) return [];
    return this.commandHistory.slice(-limit);
  }

  private isWakeWordDetected(text: string): boolean {
    const wakeWords = ['hey dashboard', 'ok dashboard', 'dashboard'];
    return wakeWords.some((wakeWord) => text.includes(wakeWord));
  }

  private async executeCommand(command: VoiceCommand): Promise<void> {
    const handler = this.commandHandlers.find(
      (item) => item.type === command.type && item.pattern.test(command.raw.toLowerCase())
    );

    if (!handler) {
      await this.speak("Sorry, I couldn't find a handler for that command.");
      return;
    }

    try {
      await handler.handler(command);
    } catch (error) {
      console.error('Voice command execution error:', error);
      await this.speak("Sorry, I couldn't execute that command.");
    }
  }

  private registerDefaultHandlers(): void {
    this.addCommandHandler({
      type: 'navigation',
      pattern: /(open|go to|navigate)/i,
      handler: async (command) => {
        const location = String(command.parameters.location || 'the dashboard');
        await this.speak(`Navigating to ${location}.`);
      },
    });

    this.addCommandHandler({
      type: 'query',
      pattern: /(search|find|show)/i,
      handler: async (command) => {
        const query = String(command.parameters.query || command.raw);
        await this.speak(`Searching for ${query}.`);
      },
    });

    this.addCommandHandler({
      type: 'action',
      pattern: /(run|start|execute)/i,
      handler: async (command) => {
        const action = String(command.parameters.action || 'that action');
        await this.speak(`Executing ${action}.`);
      },
    });

    this.addCommandHandler({
      type: 'control',
      pattern: /(toggle|set|enable|disable)/i,
      handler: async (command) => {
        const control = String(command.parameters.control || 'setting');
        await this.speak(`Updating ${control}.`);
      },
    });
  }
}
