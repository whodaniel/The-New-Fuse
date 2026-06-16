import chalk from 'chalk';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class AssimilationService {
  constructor(private repoRoot: string) {}

  /**
   * Run a command through an external agent CLI, forcing it to
   * conform to TNF protocols natively.
   *
   * @param provider The external agent CLI (e.g. 'opencode', 'openclaw')
   * @param args The arguments to pass
   */
  public async runAssimilatedCommand(
    provider: string,
    args: string[],
    options: { skipProtocolGate?: boolean } = {}
  ): Promise<void> {
    console.log(
      chalk.cyan(`[Assimilation Engine] Routing command through external provider: ${provider}`)
    );

    this.assertProviderAvailable(provider);
    if (!options.skipProtocolGate) {
      this.runProtocolGate(provider);
    }

    return new Promise((resolve, reject) => {
      const child = spawn(provider, args, {
        stdio: 'inherit',
        cwd: this.repoRoot,
        env: {
          ...process.env,
          TNF_HARNESS_ROOT: this.repoRoot,
          TNF_PROTOCOL_ACK: 'TNF_PROTOCOL_ACK',
          TNF_TURN_ZERO_CANONICAL: path.join(this.repoRoot, 'docs/protocols/TURN_ZERO_MANDATE.md'),
        },
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

  private assertProviderAvailable(provider: string): void {
    const result = spawnSync('command', ['-v', provider], {
      shell: true,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status !== 0) {
      throw new Error(
        `Provider '${provider}' not found on PATH. Link or install it before routing.`
      );
    }
  }

  private runProtocolGate(provider: string): void {
    const mandatePath = path.join(this.repoRoot, 'docs/protocols/TURN_ZERO_MANDATE.md');
    const livingStatePath = path.join(this.repoRoot, 'docs/protocols/LIVING_STATE.md');
    const handoffPath = path.join(
      this.repoRoot,
      'docs/protocols/reports/SESSION_HANDOFF_LATEST.json'
    );
    for (const requiredPath of [mandatePath, livingStatePath, handoffPath]) {
      if (!fs.existsSync(requiredPath)) {
        throw new Error(
          `TNF protocol artifact missing before assimilating ${provider}: ${requiredPath}`
        );
      }
    }

    const result = spawnSync(
      process.execPath,
      ['scripts/protocols/validate-turn-zero-authority.cjs', '--mode=ci'],
      {
        cwd: this.repoRoot,
        stdio: 'inherit',
        env: process.env,
      }
    );
    if (result.status !== 0) {
      throw new Error(`Turn Zero authority validation failed before assimilating ${provider}`);
    }
  }

  /**
   * Register a new external CLI mapping into the assimilation routing table.
   */
  public linkProvider(provider: string): void {
    console.log(chalk.green(`[Assimilation Engine] Linked external provider: ${provider}`));
    // In future: write this to .agent/assimilation-routes.json
  }
}
