import { createCustomLogger } from '@the-new-fuse/utils';
import { exec } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { join } from 'path';
import { Telegraf } from 'telegraf';
import { promisify } from 'util';
import { LLMClient, LLMMessage } from '../utils/llm-client.js';

const execAsync = promisify(exec);

type VoiceMode = 'off' | 'voice_only' | 'all';

/**
 * Service for managing the TNF Telegram bot integration
 */
export class TelegramService {
  private bot: Telegraf<any> | null = null;
  private readonly repoRoot: string;
  private isRunning: boolean = false;
  private mode: 'polling' | 'webhook' | 'none' = 'none';
  private startTime: number = 0;
  private voiceMode: Map<number, VoiceMode> = new Map();
  private llmClient: LLMClient | null = null;

  private readonly logger: any;

  private readonly WHISPER_PATH =
    process.env.TNF_WHISPER_PATH || path.join(os.homedir(), 'bin', 'whisper.cpp');
  private readonly WHISPER_MODEL =
    process.env.TNF_WHISPER_MODEL || path.join(os.homedir(), '.whisper-models', 'ggml-base.en.bin');
  private readonly EDGE_TTS_VOICE = 'en-US-AriaNeural';

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.logger = createCustomLogger('telegram-service');

    // Load environment variables from .env.tnf-telegram
    const envPath = join(repoRoot, '.env.tnf-telegram');
    try {
      dotenv.config({ path: envPath });
      this.logger.info('Loaded environment from .env.tnf-telegram');
    } catch (error) {
      this.logger.warn('Could not load .env.tnf-telegram file');
    }
  }

  /**
   * Initialize the LLM client for AI processing
   */
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

  /**
   * Process message through AI and get response
   */
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
          content: `You are TNF (The New Fuse), a helpful AI assistant. Keep responses concise and helpful.`,
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
      this.logger.info('AI response raw:', response);

      if (!response || response.trim().length === 0) {
        this.logger.error('AI returned empty response!');
        return 'Sorry, I could not generate a response. Please try again.';
      }

      this.logger.info('AI response:', response.substring(0, 100));

      return response;
    } catch (error: any) {
      this.logger.error('AI processing error:', error.message, error.stack);
      return `Error processing request: ${error.message}`;
    }
  }

  /**
   * Get voice mode for a chat
   */
  private getVoiceMode(chatId: number): VoiceMode {
    return this.voiceMode.get(chatId) || 'off';
  }

  /**
   * Set voice mode for a chat
   */
  private setVoiceMode(chatId: number, mode: VoiceMode): void {
    this.voiceMode.set(chatId, mode);
  }

  /**
   * Transcribe audio using whisper.cpp
   */
  private async transcribeAudio(filePath: string): Promise<string> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tnf-tts-'));
    const outputFile = path.join(tempDir, 'transcript.txt');

    try {
      const cmd = `"${this.WHISPER_PATH}" -m "${this.WHISPER_MODEL}" -f "${filePath}" --output_format txt --output_dir "${tempDir}" 2>/dev/null`;
      await execAsync(cmd);

      // whisper.cpp outputs to a file with same name as input, extension .txt
      const transcriptFile = filePath.replace(/\.[^.]+$/, '.txt');
      const transcript = await fs.readFile(transcriptFile, 'utf-8');

      return transcript.trim();
    } finally {
      // Cleanup
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {}
    }
  }

  /**
   * Generate TTS audio using edge-tts
   */
  private async generateTTS(text: string): Promise<string> {
    const tempFile = path.join(os.tmpdir(), `tnf-tts-${Date.now()}.mp3`);

    try {
      const cmd = `edge-tts --voice "${this.EDGE_TTS_VOICE}" --text "${text.replace(/"/g, '\\"')}" --write-media "${tempFile}" 2>/dev/null`;
      await execAsync(cmd);
      return tempFile;
    } catch (error) {
      this.logger.error('TTS generation failed:', error);
      throw error;
    }
  }

  /**
   * Download file from Telegram
   */
  private async downloadFile(fileId: string): Promise<string> {
    if (!this.bot) throw new Error('Bot not initialized');

    const tempFile = path.join(os.tmpdir(), `voice-${Date.now()}.ogg`);

    try {
      const fileLink = await this.bot.telegram.getFileLink(fileId);
      const response = await fetch(fileLink.toString());
      const buffer = await response.arrayBuffer();
      await fs.writeFile(tempFile, Buffer.from(buffer));
      return tempFile;
    } catch (error) {
      this.logger.error('File download failed:', error);
      throw error;
    }
  }

  /**
   * Start the bot in polling mode
   */
  async startPolling(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Telegram bot is already running');
    }

    const token = process.env.TNF_TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TNF_TELEGRAM_BOT_TOKEN not found in environment');
    }

    // Initialize LLM client for AI processing
    await this.initializeLLM();

    this.logger.info('Starting Telegram bot in polling mode');
    this.bot = new Telegraf(token);

    // Set up command handlers
    this.setupCommandHandlers();

    // Start polling
    await this.bot.launch();

    this.isRunning = true;
    this.mode = 'polling';
    this.startTime = Date.now();
    this.logger.info('Telegram bot started in polling mode');
  }

  /**
   * Start the bot in webhook mode
   */
  async startWebhook(port: number): Promise<void> {
    if (this.isRunning) {
      throw new Error('Telegram bot is already running');
    }

    const token = process.env.TNF_TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TNF_TELEGRAM_BOT_TOKEN not found in environment');
    }

    this.logger.info(`Starting Telegram bot in webhook mode on port ${port}`);
    this.bot = new Telegraf(token);

    // Set up command handlers
    this.setupCommandHandlers();

    // Start webhook
    await this.bot.launch({
      webhook: {
        domain: `http://localhost:${port}`,
        port: port,
      },
    });

    this.isRunning = true;
    this.mode = 'webhook';
    this.startTime = Date.now();
    this.logger.info(`Telegram bot started in webhook mode on port ${port}`);
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.bot) {
      this.logger.warn('Telegram bot is not running');
      return;
    }

    this.logger.info('Stopping Telegram bot');
    await this.bot.stop('Telegram bot service stopping');
    this.bot = null;
    this.isRunning = false;
    this.mode = 'none';
    this.logger.info('Telegram bot stopped');
  }

  /**
   * Get the current status of the bot
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    mode: string;
    uptime?: number;
    lastUpdate?: string;
    webhookUrl?: string;
  }> {
    const uptime = this.isRunning ? Math.floor((Date.now() - this.startTime) / 1000) : undefined;

    return {
      isRunning: this.isRunning,
      mode: this.mode,
      uptime,
      lastUpdate: this.isRunning ? new Date().toISOString() : undefined,
    };
  }

  /**
   * Send a message via the bot
   */
  async sendMessage(chatId: string, message: string, parseMode?: string): Promise<void> {
    if (!this.isRunning || !this.bot) {
      throw new Error('Telegram bot is not running');
    }

    await this.bot.telegram.sendMessage(chatId, message, {
      parse_mode: parseMode as any,
    });

    this.logger.info(`Message sent to chat ${chatId}`);
  }

  /**
   * Set up command handlers for the bot
   */
  private setupCommandHandlers(): void {
    if (!this.bot) return;

    // Only allow commands from the strict allowlist
    const ALLOWED_COMMANDS = new Set([
      'start',
      'help',
      'status',
      'heartbeat',
      'handoff',
      'directive',
      'ledger',
      'agents',
      'cmd',
      'voice',
    ]);

    // Handle text messages
    this.bot.on('text', async (ctx) => {
      const messageText = ctx.message.text.trim();
      const chatId = ctx.chat.id;
      const voiceMode = this.getVoiceMode(chatId);

      this.logger.info('Received text message:', messageText.substring(0, 50));

      // Check if it's a command (starts with /)
      if (messageText.startsWith('/')) {
        const command = messageText.substring(1).split(' ')[0]; // Get command name without args

        if (!ALLOWED_COMMANDS.has(command)) {
          await ctx.reply(
            `❌ Command not allowed: /${command}\n\nAllowed commands: ${Array.from(ALLOWED_COMMANDS).sort().join(', ')}`
          );
          return;
        }
        // For allowed commands, let command handlers deal with them, don't AI process
        this.logger.info('Command detected, letting command handler process');
        return;
      }

      // Process NON-command messages through AI
      try {
        await ctx.reply('🤖 Thinking...');

        this.logger.info('Calling AI...');
        const response = await this.processWithAI(messageText);
        this.logger.info('AI response:', response.substring(0, 50));

        // Check if we should reply with voice
        if (voiceMode === 'all') {
          await ctx.reply('🔊 Generating voice response...');
          const audioPath = await this.generateTTS(response);
          await ctx.replyWithVoice({ source: audioPath });
          await fs.unlink(audioPath).catch(() => {});
        } else {
          this.logger.info('Sending AI response to Telegram, length:', response.length);
          try {
            await ctx.reply(response);
            this.logger.info('Response sent successfully');
          } catch (replyError: any) {
            this.logger.error('ctx.reply failed:', replyError.message, replyError.stack);
          }
        }
      } catch (error: any) {
        this.logger.error('Error in message handler:', error.message, error.stack);
        await ctx.reply(`❌ Error: ${error.message}`);
      }
    });

    // Handle command-specific handlers
    this.bot.command('start', (ctx) =>
      ctx.reply(
        '🤖 TNF Telegram Bot\n\n' +
          'Available commands:\n' +
          '/start - Show this help\n' +
          '/help - Show detailed help\n' +
          '/status - Get TNF system status\n' +
          '/heartbeat - Send heartbeat signal\n' +
          '/handoff - Get handoff information\n' +
          '/directive - Manage directives\n' +
          '/ledger - View directive ledger\n' +
          '/agents - List agents\n' +
          '/voice - Manage voice mode\n' +
          '/cmd <subcommand> - Execute TNF CLI subcommand\n\n' +
          'Example: /cmd version'
      )
    );

    this.bot.command('help', (ctx) =>
      ctx.reply(
        '📚 TNF Telegram Bot Help\n\n' +
          'This bot allows you to interact with the TNF system via Telegram.\n\n' +
          'Allowed commands:\n' +
          '/start - Show welcome message\n' +
          '/help - Show this help message\n' +
          '/status - Get current TNF system status\n' +
          '/heartbeat - Send a heartbeat to the system\n' +
          '/handoff - Get latest handoff information\n' +
          '/directive - View and manage directives\n' +
          '/ledger - View directive conversion ledger\n' +
          '/agents - List active agents\n' +
          '/voice - Manage voice mode\n' +
          '/cmd <subcommand> - Execute any TNF CLI subcommand\n\n' +
          'Voice mode options:\n' +
          '/voice on - Reply with voice when you send voice\n' +
          '/voice tts - Voice replies for ALL messages\n' +
          '/voice off - Disable voice mode\n' +
          '/voice status - Show current voice mode\n\n' +
          'Examples:\n' +
          '/cmd version\n' +
          '/cmd status\n' +
          '/cmd tnf-zero-turn status\n\n' +
          'Note: For security, only the above commands are allowed.'
      )
    );

    // Handle /cmd command for executing TNF CLI subcommands
    this.bot.command('cmd', async (ctx) => {
      const args = ctx.message.text.substring(5).trim(); // Remove '/cmd '
      if (!args) {
        await ctx.reply('❌ Please provide a subcommand: /cmd <subcommand>');
        return;
      }

      try {
        // TODO: Integrate with actual TNF CLI execution
        // For now, simulate execution
        await ctx.reply(`⏳ Executing: tnf ${args}\n\nThis feature is being implemented...`);

        // In a real implementation, this would:
        // 1. Parse the command and arguments
        // 2. Execute via the TNF CLI system
        // 3. Return the output
      } catch (error: any) {
        await ctx.reply(`❌ Error executing command: ${error.message}`);
      }
    });

    // Handle /voice command for voice mode management
    this.bot.command('voice', async (ctx) => {
      const chatId = ctx.chat.id;
      const args = ctx.message.text.substring(6).trim().toLowerCase();

      if (!args || args === 'status') {
        const currentMode = this.getVoiceMode(chatId);
        const modeDescriptions: Record<VoiceMode, string> = {
          off: '❌ Voice mode OFF - text replies only',
          voice_only: '🎤 Voice mode VOICE ONLY - replies with voice when you send voice',
          all: '🔊 Voice mode ALL - replies with voice for all messages',
        };
        await ctx.reply(modeDescriptions[currentMode]);
        return;
      }

      if (args === 'on' || args === 'voice_only') {
        this.setVoiceMode(chatId, 'voice_only');
        await ctx.reply(
          "✅ Voice mode enabled.\nI'll reply with voice when you send voice messages.\nUse /voice tts to get voice replies for all messages."
        );
        return;
      }

      if (args === 'tts' || args === 'all') {
        this.setVoiceMode(chatId, 'all');
        await ctx.reply('🔊 Auto-TTS enabled.\nAll my replies will include a voice message.');
        return;
      }

      if (args === 'off') {
        this.setVoiceMode(chatId, 'off');
        await ctx.reply('❌ Voice mode disabled. Text replies only.');
        return;
      }

      await ctx.reply(
        '❌ Invalid /voice argument.\n\nUsage:\n/voice on - reply with voice when you send voice\n/voice tts - voice replies for all messages\n/voice off - disable voice mode\n/voice status - show current mode'
      );
    });

    // Handle voice messages
    this.bot.on('voice', async (ctx) => {
      const chatId = ctx.chat.id;
      const voiceMode = this.getVoiceMode(chatId);

      try {
        // Download and transcribe voice message
        await ctx.reply('🎤 Received voice message, transcribing...');

        const filePath = await this.downloadFile(ctx.message.voice.file_id);
        const transcript = await this.transcribeAudio(filePath);

        // Cleanup
        await fs.unlink(filePath).catch(() => {});

        if (!transcript) {
          await ctx.reply('❌ Could not transcribe audio.');
          return;
        }

        await ctx.reply(`📝 Transcribed: "${transcript}"`);

        // Process the transcript with AI
        const response = await this.processWithAI(transcript);

        // Check if we should reply with voice
        if (voiceMode === 'voice_only' || voiceMode === 'all') {
          await ctx.reply('🔊 Generating voice response...');
          const audioPath = await this.generateTTS(response);

          await ctx.replyWithVoice({ source: audioPath });

          // Cleanup
          await fs.unlink(audioPath).catch(() => {});
        } else {
          await ctx.reply(response);
        }
      } catch (error: any) {
        this.logger.error('Voice processing error:', error);
        await ctx.reply(`❌ Voice processing failed: ${error.message}`);
      }
    });

    // Handle errors
    this.bot.catch((err) => {
      this.logger.error('Telegram bot error:', err);
    });
  }
}
