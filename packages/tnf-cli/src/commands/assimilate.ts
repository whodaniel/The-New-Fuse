import { Command } from 'commander';
import { AssimilationService } from '../services/AssimilationService.js';

// CORE TENET (CORRECTED 2026-07-22) — embedded in executable source for both
// open-source installable and hosted server-side orchestration propagation:
// TNF exists to PARODY + ASSIMILATE the BEST from ANY and ALL cutting-edge
// AI agents (NOT "Hermes-to-TNF parity"). This applies on an ongoing,
// self-iterative basis. See skill: tnf-parody-assimilate-cycle for the canonical workflow.

export function registerAssimilateCommand(program: Command, repoRoot: string): void {
  const assimilate = program
    .command('assimilate')
    .description('Discover, evaluate, and route external agent capabilities into TNF-native systems.');

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
    .description(
      'Verify an external CLI against existing TNF provider/host authorities and write a machine-local link receipt.'
    )
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
    .description(
      'Scan current TNF assimilation, provider, skill, and Agent Resource Fabric surfaces without inventing a parallel registry.'
    )
    .option('--json', 'Emit the composed assimilation surface report as JSON')
    .action(async (options: { json?: boolean }) => {
      try {
        // CJS module intentionally lives at repo scope because it composes harness + CLI surfaces.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const scanner: any = await import('../../../../scripts/harness/assimilation-scan.cjs');
        const scan = scanner.scanAssimilationSurfaces || scanner.default?.scanAssimilationSurfaces;
        if (!scan) throw new Error('assimilation-scan.cjs does not export scanAssimilationSurfaces');
        const report = scan({ root: repoRoot, writeReceipt: true });
        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
          return;
        }
        console.log(
          `[Assimilation Engine] Resource Fabric hosts: ${report.authorities.resourceFabric.hostProfiles}; provider host pins: ${report.authorities.providerPolicy.hostPins}.`
        );
        console.log(
          `[Assimilation Engine] Resource scan: ${report.resourceFabricScan.ok ? 'PASS' : report.resourceFabricScan.reason}.`
        );
        for (const seam of report.staleSeams || []) {
          console.log(`[Assimilation Engine] Reconciled stale seam: ${seam.path} → ${seam.disposition}.`);
        }
        if (report.receipt?.latest) {
          console.log(`[Assimilation Engine] Receipt: ${report.receipt.latest}`);
        }
      } catch (error: any) {
        console.error(`[Assimilation Engine] Scan error: ${error.message}`);
        process.exit(1);
      }
    });
}
