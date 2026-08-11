import { Command } from 'commander';
import { AssimilationService } from '../services/AssimilationService.js';

// CORE TENET (CORRECTED 2026-07-22) — embedded in executable source for both
// open-source installable and hosted server-side orchestration propagation:
// TNF exists to PARODY + ASSIMILATE the BEST from ANY and ALL cutting-edge
// AI agents (NOT "Hermes-to-TNF parity"). This applies on an ongoing,
// self-iterative basis. See skill: assimilation-tenet for full workflow.

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

  assimilate
    .command('scan')
    .description('Run the Self-Evolution Flywheel to discover & weigh network agent patterns.')
    .action(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const flywheel: any = await import(
          // @ts-ignore
          '../../../../scripts/protocols/tnf-self-evolution-flywheel.cjs'
        );
        const report = flywheel.scanAgentPatterns
          ? flywheel.scanAgentPatterns()
          : flywheel.default
            ? flywheel.default.scanAgentPatterns()
            : null;
        if (report) {
          console.log(
            `[Self-Evolution Flywheel] Scanned ${report.discovered_skills} skills across network surfaces.`
          );
          console.log(
            `[Self-Evolution Flywheel] Telemetry written to docs/operations/tnf-self-evolution-telemetry.json`
          );
        }
      } catch (error: any) {
        console.error(`[Self-Evolution Flywheel] Error: ${error.message}`);
        process.exit(1);
      }
    });
}
