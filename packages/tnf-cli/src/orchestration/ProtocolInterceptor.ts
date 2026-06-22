import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { AssimilationEngine } from './AssimilationEngine.js';
import { DirectiveConversionService } from './DirectiveConversionService.js';
import { LivingStateService } from './LivingStateService.js';
import { ProceduralDisclosureService } from './ProceduralDisclosureService.js';
import { SessionHandoffService } from './SessionHandoffService.js';
import { TurnZeroService, type TurnZeroResult } from './TurnZeroService.js';

export type ProtocolCheckResult = {
  name: string;
  passed: boolean;
  details: string;
};

export type ProtocolSummary = {
  timestamp: string;
  checks: ProtocolCheckResult[];
  allPassed: boolean;
  activeDirective: string | null;
  turnZero: TurnZeroResult | null;
};

export class ProtocolInterceptor {
  private repoRoot: string;
  turnZero: TurnZeroService;
  livingState: LivingStateService;
  handoff: SessionHandoffService;
  assimilation: AssimilationEngine;
  disclosure: ProceduralDisclosureService;
  directives: DirectiveConversionService;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.turnZero = new TurnZeroService(repoRoot);
    this.livingState = new LivingStateService(repoRoot);
    this.handoff = new SessionHandoffService(repoRoot);
    this.assimilation = new AssimilationEngine(repoRoot);
    this.disclosure = new ProceduralDisclosureService(repoRoot);
    this.directives = new DirectiveConversionService(repoRoot);
  }

  getStateSummary(): Record<string, unknown> {
    const required = [
      'docs/protocols/TURN_ZERO_MANDATE.md',
      'docs/protocols/LIVING_STATE.md',
      'docs/protocols/AGENT_STATUS_LEDGER.md',
      'docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
    ];
    const present = required.filter((file) => fs.existsSync(this.resolve(file)));
    const livingContent = this.livingState.readCurrentState();
    const handoffPayload = this.handoff.readLatestJson();

    return {
      turnZero: {
        present: present.length,
        missing: required.length - present.length,
      },
      livingState: {
        present: livingContent !== null,
        synchronized: Boolean(livingContent?.includes('[STATUS:SYNCHRONIZED]')),
      },
      handoff: handoffPayload
        ? {
            id: handoffPayload.handoffId,
            status: handoffPayload.continuation?.priority ?? 'active',
          }
        : null,
      disclosure: {
        ready: { ready: Boolean(livingContent?.includes('[STATUS:SYNCHRONIZED]')) },
      },
      directives: this.directives.getSummary(),
    };
  }

  resolve(relativePath: string): string {
    return path.join(this.repoRoot, relativePath);
  }

  /**
   * Run all protocol checks and return a summary.
   */
  async runPreFlightChecks(): Promise<ProtocolSummary> {
    console.log(chalk.bold('\n═══════════════════════════════════════'));
    console.log(chalk.bold('  TNF Protocol Pre-Flight Checks'));
    console.log(chalk.bold('═══════════════════════════════════════\n'));

    const checks: ProtocolCheckResult[] = [];

    // 1. Turn Zero Mandate
    console.log(chalk.bold('▶ Protocol: Turn Zero Mandate'));
    const turnZeroResult = await this.turnZero.execute();
    checks.push({
      name: 'Turn Zero Mandate',
      passed: turnZeroResult.passed,
      details: turnZeroResult.passed
        ? `${turnZeroResult.stateFiles.length} state files, ${turnZeroResult.handoffFiles.length} handoff artifacts`
        : `${turnZeroResult.errors.length} error(s): ${turnZeroResult.errors.join(', ')}`,
    });

    // 2. Living State Synchronization
    console.log(chalk.bold('\n▶ Protocol: Living State Sync'));
    const livingStateContent = this.livingState.readCurrentState();
    const livingStateOk =
      livingStateContent !== null && livingStateContent.includes('[STATUS:SYNCHRONIZED]');
    checks.push({
      name: 'Living State Sync',
      passed: livingStateOk,
      details: livingStateOk
        ? 'STATUS:SYNCHRONIZED confirmed'
        : 'LIVING_STATE.md missing or not synchronized',
    });

    if (livingStateContent) {
      const activeDirective = this.livingState.getCurrentDirective();
      if (activeDirective) {
        console.log(chalk.cyan(`  Active Directive: ${activeDirective}`));
      }
    }

    // 3. Procedural Disclosure
    console.log(chalk.bold('\n▶ Protocol: Procedural Disclosure'));
    const disclosureResult = await this.disclosure.executeCheck();
    checks.push({
      name: 'Procedural Disclosure',
      passed: disclosureResult.ready,
      details: disclosureResult.ready
        ? `${disclosureResult.flagsDetected.length} flags detected, context loaded`
        : 'Context not loaded',
    });

    // 4. Handoff Artifact Check
    console.log(chalk.bold('\n▶ Protocol: Session Handoff'));
    const latestHandoff = this.handoff.readLatestJson();
    checks.push({
      name: 'Session Handoff',
      passed: latestHandoff !== null,
      details: latestHandoff
        ? `Handoff ${latestHandoff.handoffId} from ${latestHandoff.createdAt}`
        : 'No handoff artifact found',
    });

    // 5. Knowledge Tree Integrity
    console.log(chalk.bold('\n▶ Protocol: Knowledge Tree Integrity'));
    const knowledgeTreePath = 'KNOWLEDGE_TREE.json';
    const knowledgeTreeOk = fs.existsSync(this.resolve(knowledgeTreePath));
    checks.push({
      name: 'Knowledge Tree',
      passed: knowledgeTreeOk,
      details: knowledgeTreeOk ? 'Present' : 'Missing',
    });

    // 6. Integration Verification
    console.log(chalk.bold('\n▶ Protocol: Integration Verification'));
    const coreProtocolsDir = 'docs/protocols';
    const coreProtocolsOk = fs.existsSync(this.resolve(coreProtocolsDir));
    checks.push({
      name: 'Core Protocols',
      passed: coreProtocolsOk,
      details: coreProtocolsOk
        ? `${fs.readdirSync(this.resolve(coreProtocolsDir)).filter((f) => f.endsWith('.md')).length} protocol files`
        : 'Missing',
    });

    // Summary
    const allPassed = checks.every((c) => c.passed);
    console.log(chalk.bold('\n═══════════════════════════════════════'));
    console.log(chalk.bold('  Protocol Check Summary'));
    console.log(chalk.bold('═══════════════════════════════════════\n'));
    for (const check of checks) {
      const icon = check.passed ? chalk.green('✓') : chalk.red('✗');
      console.log(`${icon} ${check.name}: ${check.details}`);
    }

    console.log(chalk.bold('\nResult:'));
    if (allPassed) {
      console.log(chalk.green('  ALL PROTOCOLS PASSED'));
    } else {
      const failed = checks.filter((c) => !c.passed);
      console.log(chalk.yellow(`  ${failed.length} protocol check(s) failed`));
      for (const f of failed) {
        console.log(chalk.yellow(`  - ${f.name}: ${f.details}`));
      }
    }

    const activeDirective = livingStateContent ? this.livingState.getCurrentDirective() : null;

    return {
      timestamp: new Date().toISOString(),
      checks,
      allPassed,
      activeDirective,
      turnZero: turnZeroResult,
    };
  }

  /**
   * Enforce Turn Zero - ensure state files exist.
   * Throws if critical files are missing.
   */
  enforceTurnZero(): void {
    const required = ['docs/protocols/LIVING_STATE.md', 'docs/protocols/TURN_ZERO_MANDATE.md'];
    const missing: string[] = [];
    for (const file of required) {
      if (!fs.existsSync(this.resolve(file))) {
        missing.push(file);
      }
    }
    if (missing.length > 0) {
      console.warn(
        chalk.yellow(
          `[ProtocolInterceptor] Turn Zero enforcement: ${missing.length} file(s) missing:`
        )
      );
      for (const m of missing) {
        console.warn(chalk.yellow(`  - ${m}`));
      }
    }
  }
}
