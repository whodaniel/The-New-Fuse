/**
 * Audit Trail Gate
 * 
 * Ensures proper audit logging and traceability for AI decisions.
 */

import { Logger } from '@the-new-fuse/logger';
import { GateResult, GateFinding, GovernanceDecision, GateConfig } from './types';

const logger = new Logger({ service: 'audit-trail-gate' });

export interface AuditTrailInput {
  decisionId: string;
  modelUsed: string;
  inputHash: string;
  outputHash: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class AuditTrailGate {
  private config: GateConfig;

  constructor(config: GateConfig) {
    this.config = config;
  }

  async evaluate(input: unknown): Promise<GateResult> {
    logger.info('Running audit trail gate');

    const findings: GateFinding[] = [];
    const auditInput = input as Partial<AuditTrailInput>;

    // Check required fields
    if (!auditInput.decisionId) {
      findings.push({
        category: 'audit-missing',
        severity: 'high',
        description: 'Missing decisionId - audit trail incomplete',
        remediation: 'Include unique decision identifier',
      });
    }

    if (!auditInput.modelUsed) {
      findings.push({
        category: 'audit-missing',
        severity: 'medium',
        description: 'Missing modelUsed - cannot trace model version',
        remediation: 'Include model identifier and version',
      });
    }

    if (!auditInput.timestamp) {
      findings.push({
        category: 'audit-missing',
        severity: 'medium',
        description: 'Missing timestamp - cannot establish timeline',
        remediation: 'Include ISO 8601 timestamp',
      });
    }

    // Check hash integrity
    if (!auditInput.inputHash || !auditInput.outputHash) {
      findings.push({
        category: 'audit-integrity',
        severity: 'medium',
        description: 'Missing content hashes - cannot verify data integrity',
        remediation: 'Include SHA256 hashes of input and output',
      });
    }

    const passed = !findings.some(f => f.severity === 'critical' || f.severity === 'high');

    const decision: GovernanceDecision = passed
      ? { action: 'approve', notes: 'Audit trail complete' }
      : { action: 'conditional_approve', conditions: ['Add missing audit fields'], notes: 'Audit trail incomplete' };

    return {
      passed,
      gate: 'audit-trail',
      findings,
      decision,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export function createAuditTrailGate(config: GateConfig): AuditTrailGate {
  return new AuditTrailGate(config);
}
