import chalk from 'chalk';
import { spawn } from 'child_process';

export class AssimilationService {
  constructor(private repoRoot: string) {}

  /**
   * Run a command through an external agent CLI, forcing it to
   * conform to TNF protocols natively.
   *
   * @param provider The external agent CLI (e.g. 'opencode', 'openclaw')
   * @param args The arguments to pass
   */
  public async runAssimilatedCommand(provider: string, args: string[]): Promise<void> {
    console.log(
      chalk.cyan(`[Assimilation Engine] Routing command through external provider: ${provider}`)
    );

    // TODO: Verify the external provider is installed on PATH.
    // E.g., if provider is 'opencode', check `which opencode`

    return new Promise((resolve, reject) => {
      const child = spawn(provider, args, {
        stdio: 'inherit',
        cwd: this.repoRoot,
      });

      child.on('error', (err: any) => {
        if (err.code === 'ENOENT') {
          reject(new Error(`Provider '${provider}' not found. Is it installed?`));
        } else {
          reject(err);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green(`[Assimilation Engine] ${provider} execution complete.`));
          // TODO: In a more advanced iteration, intercept the output stream
          // and auto-write it to AGENT_STATUS_LEDGER.md here.
          resolve();
        } else {
          reject(new Error(`Provider '${provider}' exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Register a new external CLI mapping into the assimilation routing table.
   */
  public linkProvider(provider: string): void {
    console.log(chalk.green(`[Assimilation Engine] Linked external provider: ${provider}`));
    // In future: write this to .agent/assimilation-routes.json
  }
}
