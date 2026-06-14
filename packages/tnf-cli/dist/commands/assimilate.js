import { AssimilationService } from '../services/AssimilationService.js';
export function registerAssimilateCommand(program, repoRoot) {
    const assimilate = program
        .command('assimilate')
        .description('Manage integration and routing with external AI CLIs and SDKs.');
    const service = new AssimilationService(repoRoot);
    assimilate
        .command('run <provider> [args...]')
        .description('Run a command through an external provider while enforcing TNF protocols.')
        .action(async (provider, args) => {
        try {
            await service.runAssimilatedCommand(provider, args);
        }
        catch (error) {
            console.error(`[Assimilation Engine] Error: ${error.message}`);
            process.exit(1);
        }
    });
    assimilate
        .command('link <provider>')
        .description('Link a new external agent CLI to the TNF routing table.')
        .action((provider) => {
        service.linkProvider(provider);
    });
}
//# sourceMappingURL=assimilate.js.map