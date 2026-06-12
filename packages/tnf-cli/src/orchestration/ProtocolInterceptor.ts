import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export class ProtocolInterceptor {
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
  }

  /**
   * Enforces the Turn Zero Mandate.
   * Throws an error or logs a warning if required state files are missing.
   */
  public enforceTurnZeroMandate(): void {
    const requiredFiles = [
      'docs/protocols/LIVING_STATE.md',
      'docs/protocols/AGENT_STATUS_LEDGER.md',
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(this.repoRoot, file);
      if (!fs.existsSync(fullPath)) {
        console.warn(
          chalk.yellow(`[ProtocolInterceptor] WARNING: Turn Zero artifact missing: ${file}`)
        );
        console.warn(
          chalk.dim(
            `  Agents should not operate without synchronizing state. See docs/protocols/TURN_ZERO_MANDATE.md`
          )
        );
      }
    }
  }

  /**
   * Runs all protocol checks.
   */
  public runPreFlightChecks(): void {
    // We enforce Turn Zero existence.
    this.enforceTurnZeroMandate();

    // In the future, we can add Attribution Cornerstone checks here,
    // e.g., scanning recent CLI inputs/outputs for citation patterns.
  }
}
