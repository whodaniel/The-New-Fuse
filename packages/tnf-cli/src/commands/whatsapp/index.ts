import { Command } from 'commander';

// Lazy: ../../whatsapp/WhatsappService.js costs ~180ms of module eval; keep it
// off the startup path for every non-whatsapp command.
let whatsappServiceCtor: typeof import('../../whatsapp/WhatsappService.js').WhatsappService | null =
  null;
async function loadWhatsappService(): Promise<
  typeof import('../../whatsapp/WhatsappService.js').WhatsappService
> {
  if (!whatsappServiceCtor) {
    ({ WhatsappService: whatsappServiceCtor } = await import('../../whatsapp/WhatsappService.js'));
  }
  return whatsappServiceCtor;
}

export function registerWhatsappCommands(program: Command, repoRoot: string): void {
  const whatsapp = program.command('whatsapp').description('TNF WhatsApp bot integration');

  whatsapp
    .command('start')
    .description('Start the TNF WhatsApp webhook listener')
    .option('--port <port>', 'Port for the webhook server', '3000')
    .action(async (options: { port?: string }) => {
      try {
        const service = new (await loadWhatsappService())(
          repoRoot,
          parseInt(options.port || '3000', 10)
        );
        await service.start();
        console.log(`🚀 TNF WhatsApp webhook listening on port ${options.port || '3000'}`);
      } catch (error: any) {
        console.error('❌ Failed to start TNF WhatsApp service:', error.message);
        process.exit(1);
      }
    });

  whatsapp
    .command('stop')
    .description('Stop the TNF WhatsApp service')
    .action(async () => {
      try {
        const service = new (await loadWhatsappService())(repoRoot);
        await service.stop();
        console.log('⏹️  TNF WhatsApp service stopped');
      } catch (error: any) {
        console.error('❌ Failed to stop TNF WhatsApp service:', error.message);
        process.exit(1);
      }
    });

  whatsapp
    .command('status')
    .description('Get the status of the TNF WhatsApp service')
    .action(async () => {
      try {
        const service = new (await loadWhatsappService())(repoRoot);
        const statusInfo = await service.getStatus();
        console.log('📊 TNF WhatsApp Bot Status:');
        console.log(`  Status: ${statusInfo.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
        if (statusInfo.uptime !== undefined) console.log(`  Uptime: ${statusInfo.uptime}s`);
        if (statusInfo.port !== undefined) console.log(`  Port: ${statusInfo.port}`);
        if (statusInfo.messagesProcessed !== undefined)
          console.log(`  Messages processed: ${statusInfo.messagesProcessed}`);
      } catch (error: any) {
        console.error('❌ Failed to get TNF WhatsApp status:', error.message);
        process.exit(1);
      }
    });

  whatsapp
    .command('send <phoneNumber> <message>')
    .description('Send a message via the TNF WhatsApp Cloud API')
    .action(async (phoneNumber: string, message: string) => {
      try {
        const service = new (await loadWhatsappService())(repoRoot);
        await service.sendMessage(phoneNumber, message);
        console.log('✅ Message sent successfully');
      } catch (error: any) {
        console.error('❌ Failed to send message:', error.message);
        process.exit(1);
      }
    });
}
