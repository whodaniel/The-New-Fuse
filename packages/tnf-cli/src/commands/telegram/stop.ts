import { Command } from 'commander';
import { TelegramService } from '../../telegram/TelegramService.js';

export function registerTelegramStopCommand(program: Command, repoRoot: string): void {
  const stop = program.command('telegram stop').description('Stop the TNF Telegram bot service');

  stop.action(async () => {
    try {
      const service = new TelegramService(repoRoot);
      await service.stop();
      console.log('⏹️  TNF Telegram bot stopped');
    } catch (error: any) {
      console.error('❌ Failed to stop TNF Telegram bot:', error.message);
      process.exit(1);
    }
  });
}
