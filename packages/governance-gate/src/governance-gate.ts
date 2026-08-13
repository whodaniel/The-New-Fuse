/**
 * Main Governance Gate Orchestrator
 * 
 * Coordinates multiple gate checks and produces unified governance decision.
 */

import { Logger } from '@the-new-fuse/logger';
import { GateResult, GateConfig, GovernanceDecision } from './types';

const logger = new Logger({ service: 'governance-gate' });

export class GovernanceGate {
  private config: GateConfig;
  private subGates: Array<{ name: string; evaluate: (input: unknown) => Promise<GateResult> }> = [];

  constructor(config: GateConfig) {
    this.config = config;
  }

  registerGate(name: string, evaluator: (input: unknown) => Promise<GateResult>): void {
    this.subGates.push({ name, evaluate: evaluator });
    logger.info(`Registered governance gate: ${name}`);
  }

  async evaluate(input: unknown, context?: Record<string, unknown>): Promise<GateResult> {
    logger.info('Starting governance evaluation', {
      gateCount: this.subGates.length,
      strictMode: this.config.strictMode,
    });

    const allFindings = [];
    let requiresReview = false;
    let hasCriticalFinding = false;

    for (const gate of this.subGates) {
      try {
        const result = await gate.evaluate(input);
        allFindings.push(...result.findings);

        if (result.findings.some(f => f.severity === 'critical')) {
          hasCriticalFinding = true;
        }

        if (result.decision.action === 'require_review') {
          requiresReview = true;
        }
      } catch (error) {
        logger.error(`Gate ${gate.name} failed`, { error: error instanceof Error ? error.message : 'Unknown' });
        allFindings.push({
          category: 'gate_error',
          severity: 'high' as const,
          description: `Gate ${gate.name} evaluation failed`,
        });
      }
    }

    const decision: GovernanceDecision = this.makeDecision(hasCriticalFinding, requiresReview, allFindings);

    logger.info('Governance evaluation complete', {
      findingCount: allFindings.length,
      decision: decision.action,
    });

    return {
      passed: decision.action === 'approve' || decision.action === 'conditional_approve',
      gate: 'governance-gate',
      findings: allFindings,
      decision,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private makeDecision(
    hasCritical: boolean,
    requiresReview: boolean,
    findings: unknown[]
  ): GovernanceDecision {
    if (hasCritical) {
      return {
        action: 'reject',
        notes: 'Critical findings detected - manual review required',
      };
    }

    if (requiresReview || this.config.requireHumanReview) {
      return {
        action: 'require_review',
        notes: 'Human review required per configuration',
      };
    }

    return {
      action: 'approve',
      notes: `Passed all ${this.subGates.length} governance gates`,
    };
  }
}

export function createGovernanceGate(config: GateConfig): GovernanceGate {
  return new GovernanceGate(config);
}
