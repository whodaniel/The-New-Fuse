import { Command } from 'commander';
import { ParityService } from '../src/services/ParityService.ts';
import { registerPeerCliParityGapCommands } from '../src/commands/peer-cli-parity-gaps.ts';
import { registerHermesParityGapCommands } from '../src/commands/hermes-parity-gaps.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

async function main() {
  const program = new Command();
  program.name('tnf');
  program
    .option('-m, --model <model>', 'model')
    .option('-c, --continue', 'continue')
    .option('--resume [id]', 'resume')
    .option('-f, --force', 'force')
    .option('--yolo', 'yolo');
  registerPeerCliParityGapCommands(program, repoRoot);
  registerHermesParityGapCommands(program, repoRoot);
  for (const name of [
    'login',
    'logout',
    'mcp',
    'status',
    'whoami',
    'models',
    'agent',
    'plugins',
    'resume',
    'auth',
  ]) {
    if (!program.commands.some((c) => c.name() === name)) {
      program.command(name).description('seed');
    }
  }
  const ledger = await new ParityService(repoRoot).audit(program, {
    agents: ['cursor-agent'],
    timeoutMs: 45_000,
  });
  console.log(JSON.stringify(ledger.agents[0], null, 2));

  await program.parseAsync(['ls'], { from: 'user' });
  await program.parseAsync(['worker'], { from: 'user' });
}

main();
