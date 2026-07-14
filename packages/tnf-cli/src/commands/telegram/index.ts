import { Command } from 'commander';
import { TelegramService } from '../../telegram/TelegramService.js';

export function registerTelegramCommands(program: Command, repoRoot: string): void {
  const telegram = program.command('telegram').description('TNF Telegram bot integration');

  telegram
    .command('start')
    .description('Start the TNF Telegram bot service')
    .option('--polling', 'Use polling mode (default for local)', true)
    .option('--webhook', 'Use webhook mode (for cloud)')
    .option('--port <port>', 'Port for webhook mode', '3000')
    .action(async (options: { polling?: boolean; webhook?: boolean; port?: string }) => {
      try {
        const service = new TelegramService(repoRoot);
        if (options.webhook) {
          await service.startWebhook(parseInt(options.port || '3000', 10));
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

  telegram
    .command('stop')
    .description('Stop the TNF Telegram bot service')
    .action(async () => {
      try {
        const service = new TelegramService(repoRoot);
        await service.stop();
        console.log('⏹️  TNF Telegram bot stopped');
      } catch (error: any) {
        console.error('❌ Failed to stop TNF Telegram bot:', error.message);
        process.exit(1);
      }
    });

  telegram
    .command('status')
    .description('Get the status of the TNF Telegram bot service')
    .action(async () => {
      try {
        const service = new TelegramService(repoRoot);
        const statusInfo = await service.getStatus();
        console.log('📊 TNF Telegram Bot Status:');
        console.log(`  Status: ${statusInfo.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
        console.log(`  Mode: ${statusInfo.mode}`);
        console.log(`  Uptime: ${statusInfo.uptime || '0'}s`);
        console.log(`  Last update: ${statusInfo.lastUpdate || 'Never'}`);
        if (statusInfo.webhookUrl) {
          console.log(`  Webhook URL: ${statusInfo.webhookUrl}`);
        }
      } catch (error: any) {
        console.error('❌ Failed to get TNF Telegram bot status:', error.message);
        process.exit(1);
      }
    });

  telegram
    .command('send <chatId> <message>')
    .description('Send a message via the TNF Telegram bot')
    .option('--parse-mode <mode>', 'Parse mode (MarkdownV2, HTML, etc.)', 'MarkdownV2')
    .action(async (chatId: string, message: string, options: { parseMode?: string }) => {
      try {
        const service = new TelegramService(repoRoot);
        await service.sendMessage(chatId, message, options.parseMode);
        console.log('✅ Message sent successfully');
      } catch (error: any) {
        console.error('❌ Failed to send message:', error.message);
        process.exit(1);
      }
    });
}
