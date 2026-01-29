import { DashboardState } from '../collaboration/types';
import { NLPEngine } from './NLPEngine';

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

export class VoiceEngine {
  private nlpEngine: NLPEngine;
  private recognition: any; // Web Speech API recognition
  private synthesis: any; // Web Speech API synthesis
  private isListening: boolean;
  private commandHandlers: CommandHandler[];
  private commandHistory: VoiceCommand[];
  private contextState: DashboardState | null;

  constructor(nlpEngine: NLPEngine) {
    this.nlpEngine = nlpEngine;
    this.isListening = false;
    this.commandHandlers = [];
    this.commandHistory = [];
    this.contextState = null;
    this.initializeSpeechAPI();
  }

  private initializeSpeechAPI(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = async (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript;
        await this.processCommand(text);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.speak('Please enable microphone access');
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          this.recognition.start();
        }
      };
    }

    if (window.speechSynthesis) {
      this.synthesis = window.speechSynthesis;
    }
  }

  public start(): void {
    if (this.recognition) {
      this.isListening = true;
      this.recognition.start();
    } else {
      throw new Error('Speech recognition not supported');
    }
  }

  public stop(): void {
    if (this.recognition) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  public registerHandler(handler: CommandHandler): void {
    this.commandHandlers.push(handler);
  }

  public setContext(state: DashboardState): void {
    this.contextState = state;
  }

  public async processCommand(text: string): Promise<VoiceCommand | null> {
    try {
      const normalizedText = text.toLowerCase().trim();

      if (!this.isWakeWordDetected(normalizedText)) {
        return null;
      }

      const nlpResult = await this.nlpEngine.processQuery(normalizedText, this.contextState!);

      const command: VoiceCommand = {
        type: this.determineCommandType(nlpResult),
        intent: (nlpResult as any).intent || '',
        parameters: (nlpResult as any).parameters || {},
        confidence: (nlpResult as any).confidence || 0,
        raw: text,
      };

      this.commandHistory.push(command);
      await this.executeCommand(command);

      return command;
    } catch (error) {
      console.error('Error processing voice command:', error);
      return null;
    }
  }

  private isWakeWordDetected(text: string): boolean {
    const wakeWords = ['hey dashboard', 'ok dashboard', 'dashboard'];
    return wakeWords.some((word) => text.includes(word));
  }

  private determineCommandType(nlpResult: any): VoiceCommand['type'] {
    const intent = (nlpResult.intent || '').toLowerCase();
    if (intent.includes('navigate')) return 'navigation';
    if (intent.includes('search') || intent.includes('query')) return 'query';
    if (intent.includes('control')) return 'control';
    return 'action';
  }

  private async executeCommand(command: VoiceCommand): Promise<void> {
    const handler = this.commandHandlers.find(
      (h) => h.type === command.type && h.pattern.test(command.raw)
    );

    if (handler) {
      try {
        await handler.handler(command);
      } catch (error) {
        console.error('Error executing command handler:', error);
        await this.speak("Sorry, I couldn't execute that command");
      }
    } else {
      // Default handlers based on type
      switch (command.type) {
        case 'navigation':
          await this.handleNavigation(command);
          break;
        case 'query':
          await this.handleQuery(command);
          break;
        default:
          await this.speak(
            `I understood you want to ${command.intent}, but I don't know how to do that yet.`
          );
      }
    }
  }

  private async handleNavigation(command: VoiceCommand): Promise<void> {
    const location = command.parameters.location as string;
    if (location) {
      await this.speak(`Navigating to ${location}`);
      // Navigation logic would go here
    }
  }

  private async handleQuery(command: VoiceCommand): Promise<void> {
    const query = command.parameters.query as string;
    if (query) {
      await this.speak(`Searching for ${query}`);
      // Search logic would go here
    }
  }

  public async speak(text: string): Promise<void> {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => resolve();
      this.synthesis.speak(utterance);
    });
  }
}
