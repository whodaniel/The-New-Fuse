import * as dotenv from 'dotenv';
import { join } from 'path';
import { LLMClient, LLMMessage } from '../utils/llm-client.js';
import { createSimpleLogger } from '../utils/simple-logger.js';

type SlackApp = import('@slack/bolt').App;
type SlackWebClient = import('@slack/web-api').WebClient;

export class SlackService {
  private app: SlackApp | null = null;
  private webClient: SlackWebClient | null = null;
  private readonly repoRoot: string;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private llmClient: LLMClient | null = null;
  private readonly logger: any;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.logger = createSimpleLogger('slack-service');

    // Load environment variables from .env.tnf-slack
    const envPath = join(repoRoot, '.env.tnf-slack');
    try {
      dotenv.config({ path: envPath });
      this.logger.info('Loaded environment from .env.tnf-slack');
    } catch (error) {
      this.logger.warn('Could not load .env.tnf-slack file');
    }
  }

  async initializeLLM(): Promise<void> {
    try {
      this.llmClient = await LLMClient.create('worker');
      this.logger.info('LLM Client initialized', {
        provider: this.llmClient.providerName,
        model: this.llmClient.model,
      });
    } catch (error: any) {
      this.logger.error('Failed to initialize LLM client:', error.message);
    }
  }

  private async processWithAI(userMessage: string): Promise<string> {
    if (!this.llmClient) {
      this.logger.info('LLM client not initialized, initializing now...');
      await this.initializeLLM();
    }

    if (!this.llmClient) {
      this.logger.error('LLM client still not available after initialization');
      return 'AI service unavailable. Please try again later.';
    }

    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content:
            'You are TNF (The New Fuse), a helpful AI assistant connected to Slack. Keep responses concise and helpful.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ];

      this.logger.info('Calling AI with message:', userMessage.substring(0, 50));
      const response = await this.llmClient.chatComplete(messages, {
        temperature: 0.7,
        maxTokens: 500,
      });

      if (!response || response.trim().length === 0) {
        return 'Sorry, I could not generate a response. Please try again.';
      }

      return response;
    } catch (error: any) {
      this.logger.error('AI processing error:', error.message);
      return `Error processing request: ${error.message}`;
    }
  }

  async start(port: number = 3000): Promise<void> {
    if (this.isRunning) {
      throw new Error('Slack bot is already running');
    }

    const token = process.env.TNF_SLACK_BOT_TOKEN;
    const signingSecret = process.env.TNF_SLACK_SIGNING_SECRET;
    const appToken = process.env.TNF_SLACK_APP_TOKEN;

    if (!token || !signingSecret || !appToken) {
      throw new Error(
        'Missing TNF_SLACK_BOT_TOKEN, TNF_SLACK_SIGNING_SECRET, or TNF_SLACK_APP_TOKEN in environment'
      );
    }

    await this.initializeLLM();

    let App: typeof import('@slack/bolt').App;
    let WebClient: typeof import('@slack/web-api').WebClient;
    try {
      ({ App } = await import('@slack/bolt'));
      ({ WebClient } = await import('@slack/web-api'));
    } catch {
      throw new Error(
        'Slack dependencies missing. Install with: pnpm --filter @the-new-fuse/tnf-cli add @slack/bolt @slack/web-api'
      );
    }

    this.logger.info('Starting Slack bot (Socket Mode)');
    this.app = new App({
      token,
      signingSecret,
      appToken,
      socketMode: true,
      port,
    });

    this.webClient = new WebClient(token);

    this.setupEventHandlers();
    await this.app.start();

    this.isRunning = true;
    this.startTime = Date.now();
    this.logger.info('Slack bot started successfully in Socket Mode');
  }

  async stop(): Promise<void> {
    if (!this.isRunning || !this.app) {
      this.logger.warn('Slack bot is not running');
      return;
    }

    this.logger.info('Stopping Slack bot');
    await this.app.stop();
    this.app = null;
    this.webClient = null;
    this.isRunning = false;
    this.logger.info('Slack bot stopped');
  }

  async getStatus(): Promise<{
    isRunning: boolean;
    uptime?: number;
    lastUpdate?: string;
  }> {
    const uptime = this.isRunning ? Math.floor((Date.now() - this.startTime) / 1000) : undefined;
    return {
      isRunning: this.isRunning,
      uptime,
      lastUpdate: this.isRunning ? new Date().toISOString() : undefined,
    };
  }

  async sendMessage(channelId: string, message: string): Promise<void> {
    if (!this.isRunning || !this.webClient) {
      throw new Error('Slack bot is not running');
    }

    await this.webClient.chat.postMessage({
      channel: channelId,
      text: message,
    });
    this.logger.info(`Message sent to channel ${channelId}`);
  }

  private setupEventHandlers(): void {
    if (!this.app) return;

    this.app.message(async ({ message, say }: any) => {
      // Ignore bot messages and non-text messages
      if (message.subtype === 'bot_message' || !('text' in message) || !message.text) {
        return;
      }

      const text = message.text.trim();
      this.logger.info('Received Slack message:', text.substring(0, 50));

      // Handle simple built-in commands
      if (text.startsWith('!')) {
        const command = text.substring(1).split(' ')[0].toLowerCase();
        switch (command) {
          case 'status':
            const status = await this.getStatus();
            await say(
              `📊 TNF Slack Bot Status: ${status.isRunning ? '🟢 Running' : '🔴 Stopped'} (Uptime: ${status.uptime}s)`
            );
            return;
          case 'help':
            await say(
              '📚 Available commands:\n`!status` - Get bot status\n`!help` - Show this message\nOr just chat with me normally for AI processing.'
            );
            return;
        }
      }

      // Process with AI
      try {
        const response = await this.processWithAI(text);
        await say(response);
      } catch (error: any) {
        this.logger.error('Error replying to Slack message:', error.message);
        await say(`❌ Error processing request: ${error.message}`);
      }
    });

    this.app.error(async (error: any) => {
      this.logger.error('Slack App Error:', error);
    });
  }
}
