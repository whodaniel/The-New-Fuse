import { Command } from 'commander';
import { spawn } from 'child_process';
import path from 'path';

/**
 * `tnf browser` — TNF browser control surface.
 *
 * Delegates to the TNF Browser runtime (packages/tnf-browser), which drives a
 * real Chrome instance through a bundled Chrome extension + local WebSocket
 * bridge. This is TNF's assimilated browser-automation capability, formerly an
 * external project, now owned by The New Fuse.
 */
export function registerBrowserCommand(program: Command, repoRoot: string): void {
  const browser = program
    .command('browser')
    .description('TNF browser control: drive a real Chrome via the TNF Browser WebSocket runtime.');

  const binPath = path.resolve(repoRoot, 'packages', 'tnf-browser', 'bin', 'cli.js');

  function runTnfBrowser(args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [binPath, ...args], {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: process.env,
      });
      child.on('error', (err: NodeJS.ErrnoException) => reject(err));
      child.on('close', (code: number | null) => resolve(code ?? 0));
    });
  }

  browser
    .command('start')
    .description('Start the TNF Browser runtime (managed Chrome + WebSocket server).')
    .option('-d', 'Append a session log to ~/tnf-browser/tnf-browser.log')
    .action(async (options: { d?: boolean }) => {
      try {
        const code = await runTnfBrowser(['start', ...(options.d ? ['-d'] : [])]);
        process.exit(code);
      } catch (err: any) {
        console.error(`[TNF Browser] ${err?.message || err}`);
        process.exit(1);
      }
    });

  browser
    .command('stop')
    .description('Stop the TNF Browser runtime.')
    .action(async () => {
      try {
        const code = await runTnfBrowser(['stop']);
        process.exit(code);
      } catch (err: any) {
        console.error(`[TNF Browser] ${err?.message || err}`);
        process.exit(1);
      }
    });

  browser
    .command('exec <command>')
    .description(
      'Run a one-shot browser command. Example: tnf browser exec "go https://example.com"'
    )
    .action(async (command: string) => {
      try {
        const code = await runTnfBrowser(['-c', command]);
        process.exit(code);
      } catch (err: any) {
        console.error(`[TNF Browser] ${err?.message || err}`);
        process.exit(1);
      }
    });

  browser
    .command('repl')
    .description('Launch the interactive TNF Browser REPL for manual testing/debugging.')
    .action(async () => {
      try {
        const code = await runTnfBrowser([]);
        process.exit(code);
      } catch (err: any) {
        console.error(`[TNF Browser] ${err?.message || err}`);
        process.exit(1);
      }
    });
}
