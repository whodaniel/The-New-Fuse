import { Command } from 'commander';
import { TelegramService } from '../../telegram/TelegramService.js';

export function registerTelegramStartCommand(program: Command, repoRoot: string): void {
  const start = program.command('telegram start').description('Start the TNF Telegram bot service');

  start
    .option('--polling', 'Use polling mode (default for local)', true)
    .option('--webhook', 'Use webhook mode (for cloud)')
    .option('--port <port>', 'Port for webhook mode', '3000')
    .action(async (options: { polling?: boolean; webhook?: boolean; port?: string }) => {
      try {
        const service = new TelegramService(repoRoot);

        if (options.webhook) {
          await service.startWebhook(parseInt(options.port || '3000'));
          console.log(
            `🚀 TNF Telegram bot started in webhook mode on port ${options.port || '3000'}`
          );
        } else {
          await service.startPolling();
          console.log('🚀 TNF Telegram bot started in polling mode');
        }
      } catch (error: any) {
        console.error('❌ Failed to start TNF Telegram bot:', error.message);
        process.exit(1);
      }
    });
}
