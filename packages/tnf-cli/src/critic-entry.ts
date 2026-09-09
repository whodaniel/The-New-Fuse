/** Lightweight entrypoint for external harness turn-end hooks. */
import { Command } from 'commander';
import { registerCriticCommands } from './commands/critic.js';
const program = new Command();
registerCriticCommands(program, process.cwd());
program.parseAsync().catch(() => {
  console.error('[tnf critic] Could not review this handoff; working turn preserved');
  process.exitCode = 1;
});
