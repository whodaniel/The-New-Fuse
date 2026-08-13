import { Telegraf } from 'telegraf';
import { Logger } from '@the-new-fuse/utils';
import * as dotenv from 'dotenv';
import { join } from 'path';

/**
 * Service for managing the TNF Telegram bot integration
 */
export class TelegramService {
  private bot: Telegraf<any> | null = null;
  private readonly repoRoot: string;
  private isRunning: boolean = false;
  private mode: 'polling' | 'webhook' | 'none' = 'none';
  private startTime: number = 0;
  private readonly logger: Logger;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.logger = new Logger({ service: 'telegram-service' });
    
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
      }
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
      'cmd'
    ]);

    // Handle text messages
    this.bot.on('text', async (ctx) => {
      const messageText = ctx.message.text.trim();
      
      // Check if it's a command (starts with /)
      if (messageText.startsWith('/')) {
        const command = messageText.substring(1).split(' ')[0]; // Get command name without args
        
        if (!ALLOWED_COMMANDS.has(command)) {
          await ctx.reply(`❌ Command not allowed: /${command}\n\nAllowed commands: ${Array.from(ALLOWED_COMMANDS).sort().join(', ')}`);
          return;
        }
      }

      // For allowed commands, delegate to TNF CLI
      try {
        // Execute the command via TNF CLI
        // This would normally integrate with the TNF system to execute the command
        // For now, we'll acknowledge receipt
        await ctx.reply(`✅ Received: ${messageText}\n\nProcessing via TNF CLI...`);
        
        // TODO: Integrate with actual TNF command execution system
        // This would involve publishing to the TNF task queue or similar
        
      } catch (error: any) {
        await ctx.reply(`❌ Error processing command: ${error.message}`);
        this.logger.error(`Error processing Telegram command: ${error}`);
      }
    });

    // Handle command-specific handlers
    this.bot.command('start', (ctx) => ctx.reply(
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
      '/cmd <subcommand> - Execute TNF CLI subcommand\n\n' +
      'Example: /cmd version'
    ));

    this.bot.command('help', (ctx) => ctx.reply(
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
      '/cmd <subcommand> - Execute any TNF CLI subcommand\n\n' +
      'Examples:\n' +
      '/cmd version\n' +
      '/cmd status\n' +
      '/cmd tnf-zero-turn status\n\n' +
      'Note: For security, only the above commands are allowed.'
    ));

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

    // Handle errors
    this.bot.catch((err) => {
      this.logger.error('Telegram bot error:', err);
    });
  }
}
