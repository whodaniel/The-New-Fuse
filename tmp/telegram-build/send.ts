import { Command } from 'commander';
import { TelegramService } from '../../services/TelegramService.js';

export function registerTelegramSendCommand(program: Command, repoRoot: string): void {
  const send = program
    .command('telegram send <chatId> <message>')
    .description('Send a message via the TNF Telegram bot');

  send
    .option('--parse-mode <mode>', 'Parse mode (MarkdownV2, HTML, etc.)', 'MarkdownV2')
    .action(async (chatId: string, message: string, options: { parseMode?: string }) => {
      try {
        const service = new TelegramService(/* repoRoot would be passed in */ '');
        await service.sendMessage(chatId, message, options.parseMode);
        console.log('✅ Message sent successfully');
      } catch (error: any) {
        console.error('❌ Failed to send message:', error.message);
        process.exit(1);
      }
    });
}
