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
    const strict = this.isStrict();
    const requiredFiles = [
      'docs/protocols/TURN_ZERO_MANDATE.md',
      'docs/protocols/LIVING_STATE.md',
      'docs/protocols/AGENT_STATUS_LEDGER.md',
      'docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
      'docs/protocols/schemas/tnf-session-handoff.schema.json',
      '.agent/SYSTEM_PROMPT.md',
      '.agent/context/resource-map.md',
      '.agent/context/agent-onboarding.md',
      '.agent/workflows/frontload.md',
    ];
    const missingFiles: string[] = [];

    for (const file of requiredFiles) {
      const fullPath = path.join(this.repoRoot, file);
      if (!fs.existsSync(fullPath)) {
        missingFiles.push(file);
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

    if (missingFiles.length > 0 && strict) {
      throw new Error(
        `Turn Zero preflight failed. Missing required artifact(s): ${missingFiles.join(', ')}`
      );
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

  private isStrict(): boolean {
    const value = process.env.TNF_PROTOCOL_STRICT || process.env.TNF_TURN_ZERO_STRICT;
    return typeof value === 'string' && ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
}
