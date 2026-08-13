import { Command } from 'commander';
import { SlackService } from '../../slack/SlackService.js';

export function registerSlackCommands(program: Command, repoRoot: string): void {
  const slack = program.command('slack').description('TNF Slack bot integration');

  slack
    .command('start')
    .description('Start the TNF Slack bot service in Socket Mode')
    .option('--port <port>', 'Port for the internal server', '3000')
    .action(async (options: { port?: string }) => {
      try {
        const service = new SlackService(repoRoot);
        await service.start(parseInt(options.port || '3000', 10));
        console.log('🚀 TNF Slack bot started in Socket Mode');
      } catch (error: any) {
        console.error('❌ Failed to start TNF Slack bot:', error.message);
        process.exit(1);
      }
    });

  slack
    .command('stop')
    .description('Stop the TNF Slack bot service')
    .action(async () => {
      try {
        const service = new SlackService(repoRoot);
        await service.stop();
        console.log('⏹️  TNF Slack bot stopped');
      } catch (error: any) {
        console.error('❌ Failed to stop TNF Slack bot:', error.message);
        process.exit(1);
      }
    });

  slack
    .command('status')
    .description('Get the status of the TNF Slack bot service')
    .action(async () => {
      try {
        const service = new SlackService(repoRoot);
        const statusInfo = await service.getStatus();
        console.log('📊 TNF Slack Bot Status:');
        console.log(`  Status: ${statusInfo.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
        console.log(`  Uptime: ${statusInfo.uptime || '0'}s`);
        console.log(`  Last update: ${statusInfo.lastUpdate || 'Never'}`);
      } catch (error: any) {
        console.error('❌ Failed to get TNF Slack bot status:', error.message);
        process.exit(1);
      }
    });

  slack
    .command('send <channelId> <message>')
    .description('Send a message via the TNF Slack bot')
    .action(async (channelId: string, message: string) => {
      try {
        const service = new SlackService(repoRoot);
        await service.sendMessage(channelId, message);
        console.log('✅ Message sent successfully');
      } catch (error: any) {
        console.error('❌ Failed to send message:', error.message);
        process.exit(1);
      }
    });
}
