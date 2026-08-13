import chalk from 'chalk';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { formatWorkPlaneOrientationConsole } from '../utils/work-plane.js';
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
  substrateBlocked: boolean;
};

function isTruthyEnv(value: string | undefined): boolean {
  if (value == null) return false;
  const v = String(value).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export class ProtocolInterceptor {
  private repoRoot: string;
  turnZero: TurnZeroService;
  livingState: LivingStateService;
  handoff: SessionHandoffService;
  assimilation: AssimilationEngine;
  disclosure: ProceduralDisclosureService;
  directives: DirectiveConversionService;
  /**
   * When true, suppress all cosmetic console output from runPreFlightChecks
   * while still running every check. Used by --no-splash consumers so CI
   * pipes and LLM-driving agents get a clean JSON stdout.
   */
  silent: boolean;

  constructor(repoRoot: string, options: { silent?: boolean } = {}) {
    this.repoRoot = repoRoot;
    this.silent = Boolean(options.silent);
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
   * When constructed with `silent: true`, cosmetic console output is
   * suppressed; checks still run and the summary is returned unchanged.
   */
  async runPreFlightChecks(): Promise<ProtocolSummary> {
    const log = this.silent
      ? () => {
          /* silenced */
        }
      : (line: string) => console.log(line);
    log(chalk.bold('\n═══════════════════════════════════════'));
    log(chalk.bold('  TNF Protocol Pre-Flight Checks'));
    log(chalk.bold('═══════════════════════════════════════\n'));

    const checks: ProtocolCheckResult[] = [];

    // 1. Turn Zero Mandate
    log(chalk.bold('▶ Protocol: Turn Zero Mandate'));
    const turnZeroResult = await this.turnZero.execute({ silent: this.silent });
    // Report how many steps actually ran. "Turn Zero passed" previously said
    // nothing about whether integrity or repo-sync were verified or merely
    // asserted; a skipped-step count keeps that visible to every consumer.
    const skippedSteps = Object.values(turnZeroResult.checks).filter(
      (c) => c.state === 'skipped'
    ).length;
    checks.push({
      name: 'Turn Zero Mandate',
      passed: turnZeroResult.passed,
      details: turnZeroResult.passed
        ? `${turnZeroResult.stateFiles.length} state files, ${turnZeroResult.handoffFiles.length} handoff artifacts` +
          (skippedSteps > 0 ? `, ${skippedSteps} step(s) skipped` : ', all steps verified')
        : `${turnZeroResult.errors.length} error(s): ${turnZeroResult.errors.join(', ')}`,
    });

    // 2. Living State Synchronization
    log(chalk.bold('\n▶ Protocol: Living State Sync'));
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

    if (!this.silent && livingStateContent) {
      const activeDirective = this.livingState.getCurrentDirective();
      if (activeDirective) {
        log(chalk.cyan(`  Active Directive: ${activeDirective}`));
      }
    }

    // Work-plane orientation (every interactive preflight — OSS vs tenant/personal)
    if (!this.silent) {
      for (const line of formatWorkPlaneOrientationConsole()) {
        log(chalk.dim(line));
      }
    }

    // 3. Procedural Disclosure
    log(chalk.bold('\n▶ Protocol: Procedural Disclosure'));
    const disclosureResult = await this.disclosure.executeCheck({ silent: this.silent });
    checks.push({
      name: 'Procedural Disclosure',
      passed: disclosureResult.ready,
      details: disclosureResult.ready
        ? `${disclosureResult.flagsDetected.length} flags detected, context loaded`
        : 'Context not loaded',
    });

    // 4. Handoff Artifact Check
    log(chalk.bold('\n▶ Protocol: Session Handoff'));
    const latestHandoff = this.handoff.readLatestJson();
    checks.push({
      name: 'Session Handoff',
      passed: latestHandoff !== null,
      details: latestHandoff
        ? `Handoff ${latestHandoff.handoffId} from ${latestHandoff.createdAt}`
        : 'No handoff artifact found',
    });

    // 5. Knowledge Tree Integrity
    log(chalk.bold('\n▶ Protocol: Knowledge Tree Integrity'));
    const knowledgeTreePath = 'KNOWLEDGE_TREE.json';
    const knowledgeTreeOk = fs.existsSync(this.resolve(knowledgeTreePath));
    checks.push({
      name: 'Knowledge Tree',
      passed: knowledgeTreeOk,
      details: knowledgeTreeOk ? 'Present' : 'Missing',
    });

    // 6. Integration Verification
    log(chalk.bold('\n▶ Protocol: Integration Verification'));
    const coreProtocolsDir = 'docs/protocols';
    const coreProtocolsOk = fs.existsSync(this.resolve(coreProtocolsDir));
    checks.push({
      name: 'Core Protocols',
      passed: coreProtocolsOk,
      details: coreProtocolsOk
        ? `${fs.readdirSync(this.resolve(coreProtocolsDir)).filter((f) => f.endsWith('.md')).length} protocol files`
        : 'Missing',
    });

    // 7. Substrate attestation (warn by default; fail-closed with TNF_REQUIRE_SUBSTRATE=1)
    log(chalk.bold('\n▶ Protocol: Substrate Attestation'));
    const substrate = this.runSubstrateAttestation();
    checks.push({
      name: 'Substrate Attestation',
      passed: substrate.passed,
      details: substrate.details,
    });

    // Summary — silent mode skips this entirely so the consumer gets a
    // clean stdout (the JSON envelope) on the caller side.
    if (!this.silent) {
      const allPassed = checks.every((c) => c.passed);
      log(chalk.bold('\n═══════════════════════════════════════'));
      log(chalk.bold('  Protocol Check Summary'));
      log(chalk.bold('═══════════════════════════════════════\n'));
      for (const check of checks) {
        const icon = check.passed ? chalk.green('✓') : chalk.red('✗');
        log(`${icon} ${check.name}: ${check.details}`);
      }

      log(chalk.bold('\nResult:'));
      if (allPassed) {
        // Final PASS/FAIL belongs to `tnf protocol gate` (or other callers) after
        // CI subgates. Interceptor output is provisional only — unless legacy banner
        // is explicitly requested.
        if (isTruthyEnv(process.env.TNF_PROTOCOL_GATE_LEGACY_BANNER)) {
          log(chalk.green('  ALL PROTOCOLS PASSED'));
        } else {
          log(chalk.cyan('  PREFLIGHT SECTIONS OK (provisional)'));
        }
      } else {
        const failed = checks.filter((c) => !c.passed);
        log(chalk.yellow(`  ${failed.length} protocol check(s) failed (provisional)`));
        for (const f of failed) {
          log(chalk.yellow(`  - ${f.name}: ${f.details}`));
        }
      }
    } else {
      // In silent mode, surface failures to stderr so CI doesn't lose them.
      const failed = checks.filter((c) => !c.passed);
      if (failed.length > 0) {
        process.stderr.write(
          `[ProtocolInterceptor] silent mode: ${failed.length} protocol check(s) failed\n`
        );
        for (const f of failed) {
          process.stderr.write(`  - ${f.name}: ${f.details}\n`);
        }
      }
    }

    const activeDirective = livingStateContent ? this.livingState.getCurrentDirective() : null;

    return {
      timestamp: new Date().toISOString(),
      checks,
      allPassed: checks.every((c) => c.passed),
      activeDirective,
      turnZero: turnZeroResult,
      substrateBlocked: substrate.blocked,
    };
  }

  runSubstrateAttestation(): { passed: boolean; details: string; blocked: boolean } {
    if (isTruthyEnv(process.env.TNF_SKIP_SUBSTRATE)) {
      return { passed: true, details: 'skipped (TNF_SKIP_SUBSTRATE=1)', blocked: false };
    }
    const requireMode = isTruthyEnv(process.env.TNF_REQUIRE_SUBSTRATE);
    const script = this.resolve('scripts/protocols/validate-substrate-attestation.cjs');
    if (!fs.existsSync(script)) {
      const details = 'validator missing: scripts/protocols/validate-substrate-attestation.cjs';
      return { passed: !requireMode, details, blocked: requireMode };
    }
    const mode = requireMode ? 'require' : 'warn';
    const result = spawnSync(process.execPath, [script, `--mode=${mode}`, '--json'], {
      cwd: this.repoRoot,
      encoding: 'utf8',
      env: process.env,
      timeout: 15_000,
    });
    let summary: any = null;
    try {
      const stdout = (result.stdout || '').trim();
      const jsonStart = stdout.indexOf('{');
      summary = jsonStart >= 0 ? JSON.parse(stdout.slice(jsonStart)) : null;
    } catch {
      summary = null;
    }
    if (!summary) {
      const err = (result.stderr || result.stdout || 'substrate probe failed').trim().slice(0, 240);
      return {
        passed: !requireMode,
        details: `substrate probe error: ${err}`,
        blocked: requireMode,
      };
    }
    const hard = summary.hardFailures ?? (summary.ok ? 0 : 1);
    const soft = summary.softFailures ?? 0;
    const failedIds = (summary.checks || [])
      .filter((c: any) => !c.ok)
      .map((c: any) => c.id)
      .slice(0, 6)
      .join(',');
    const details =
      hard === 0 && soft === 0
        ? 'install + runtime probes clean'
        : `hard=${hard} soft=${soft}${failedIds ? ` (${failedIds})` : ''} — set TNF_REQUIRE_SUBSTRATE=1 to fail closed`;
    if (requireMode && hard > 0) return { passed: false, details, blocked: true };
    return { passed: true, details, blocked: false };
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
