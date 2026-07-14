import { Command } from 'commander';
import { TelegramService } from '../../telegram/TelegramService.js';

export function registerTelegramStatusCommand(program: Command, repoRoot: string): void {
  const status = program
    .command('telegram status')
    .description('Get the status of the TNF Telegram bot service');

  status.action(async () => {
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
}
