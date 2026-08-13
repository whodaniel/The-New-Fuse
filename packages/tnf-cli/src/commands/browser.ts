import { spawn } from 'child_process';
import { Command } from 'commander';
import path from 'path';

import {
  type AgentBrowserOperation,
  AGENT_BROWSER_OPERATIONS,
  normalizeAgentBrowserOperation,
  runAgentBrowser,
} from '../utils/browser-routing.js';

/**
 * `tnf browser` — TNF browser control surface.
 *
 * The primary backend is agent-browser. Read-only extraction belongs to
 * Crawl4AI; this command is for stateful navigation and interaction.
 *
 * The old TNF Browser extension/WebSocket runtime remains available through
 * explicitly named `legacy-*` commands while Tauri consumers migrate.
 */
export function registerBrowserCommand(program: Command, repoRoot: string): void {
  const browser = program
    .command('browser')
    .description('TNF interactive browser control via agent-browser.');

  const legacyBinPath = path.resolve(repoRoot, 'packages', 'tnf-browser', 'bin', 'cli.js');

  function runLegacyBrowser(args: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [legacyBinPath, ...args], {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: process.env,
      });
      child.on('error', (err: NodeJS.ErrnoException) => reject(err));
      child.on('close', (code: number | null) => resolve(code ?? 0));
    });
  }

  async function runPrimary(
    operation: AgentBrowserOperation,
    options: {
      target?: string;
      value?: string;
      profile?: string;
      state?: string;
      session?: string;
      headed?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const result = await runAgentBrowser(
        repoRoot,
        {
          operation,
          target: options.target,
          value: options.value,
          profile: options.profile ?? process.env.TNF_BROWSER_PROFILE,
          stateFile: options.state,
          session: options.session,
          headed: options.headed,
          json: false,
        },
        { stdio: 'inherit' }
      );
      process.exit(result.code);
    } catch (err: any) {
      console.error(`[TNF Browser] ${err?.message || err}`);
      process.exit(1);
    }
  }

  browser
    .command('start')
    .description('Open a visible agent-browser session.')
    .option('--profile <profile>', 'Chrome profile name or persistent profile directory')
    .option('--state <file>', 'Playwright-compatible storage-state file')
    .option('--session <name>', 'Isolated agent-browser session name')
    .option('--url <url>', 'Initial URL', 'about:blank')
    .action(async (options) => {
      await runPrimary('open', {
        target: options.url,
        profile: options.profile,
        state: options.state,
        session: options.session,
        headed: true,
      });
    });

  browser
    .command('stop')
    .description('Close the active agent-browser session.')
    .option('--session <name>', 'Session name to close')
    .action(async (options) => {
      await runPrimary('close', { session: options.session });
    });

  browser
    .command('exec <operation> [target] [value]')
    .description(`Run an agent-browser operation: ${AGENT_BROWSER_OPERATIONS.join(', ')}`)
    .option('--profile <profile>', 'Chrome profile name or persistent profile directory')
    .option('--state <file>', 'Playwright-compatible storage-state file')
    .option('--session <name>', 'Isolated agent-browser session name')
    .option('--headed', 'Show a visible window when opening')
    .action(
      async (operation: string, target: string | undefined, value: string | undefined, options) => {
        let normalized: AgentBrowserOperation;
        try {
          normalized = normalizeAgentBrowserOperation(operation);
        } catch {
          console.error(
            `[TNF Browser] Unsupported operation "${operation}". Supported: ${AGENT_BROWSER_OPERATIONS.join(', ')}`
          );
          process.exit(2);
          return;
        }
        await runPrimary(normalized, {
          target,
          value,
          profile: options.profile,
          state: options.state,
          session: options.session,
          headed: options.headed,
        });
      }
    );

  browser
    .command('profiles')
    .description('List reusable Chrome profiles detected by agent-browser.')
    .action(async () => {
      await runPrimary('profiles');
    });

  browser
    .command('legacy-start')
    .description('Start the deprecated TNF extension/WebSocket runtime.')
    .option('-d', 'Append a session log to ~/tnf-browser/tnf-browser.log')
    .action(async (options: { d?: boolean }) => {
      try {
        console.warn(
          '[TNF Browser] Legacy extension mode is deprecated; prefer `tnf browser start`.'
        );
        const code = await runLegacyBrowser(['start', ...(options.d ? ['-d'] : [])]);
        process.exit(code);
      } catch (err: any) {
        console.error(`[TNF Browser] ${err?.message || err}`);
        process.exit(1);
      }
    });

  browser
    .command('legacy-stop')
    .description('Stop the deprecated TNF extension/WebSocket runtime.')
    .action(async () => {
      const code = await runLegacyBrowser(['stop']);
      process.exit(code);
    });

  browser
    .command('legacy-exec <command>')
    .description('Run a command through the deprecated extension/WebSocket runtime.')
    .action(async (command: string) => {
      const code = await runLegacyBrowser(['-c', command]);
      process.exit(code);
    });
}
