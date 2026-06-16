import { Command } from 'commander';
import { AssimilationService } from '../services/AssimilationService.js';

export function registerAssimilateCommand(program: Command, repoRoot: string): void {
  const assimilate = program
    .command('assimilate')
    .description('Manage integration and routing with external AI CLIs and SDKs.');

  const service = new AssimilationService(repoRoot);

  assimilate
    .command('run <provider> [args...]')
    .description('Run a command through an external provider while enforcing TNF protocols.')
    .option('--skip-protocol-gate', 'Skip fast TNF protocol gate before provider execution')
    .action(async (provider: string, args: string[], options: { skipProtocolGate?: boolean }) => {
      try {
        await service.runAssimilatedCommand(provider, args, {
          skipProtocolGate: options.skipProtocolGate,
        });
      } catch (error: any) {
        console.error(`[Assimilation Engine] Error: ${error.message}`);
        process.exit(1);
      }
    });

  assimilate
    .command('link <provider>')
    .description('Link a new external agent CLI to the TNF routing table.')
    .action(async (provider: string) => {
      try {
        await service.linkProvider(provider);
      } catch (error: any) {
        console.error(`[Assimilation Engine] Error: ${error.message}`);
        process.exit(1);
      }
    });
}
