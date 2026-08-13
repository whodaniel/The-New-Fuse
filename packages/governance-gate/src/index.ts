/**
 * Governance Gate Framework
 * 
 * Pre-adoption security and compliance validation for AI5 directives.
 * Implements gates for: security review, PII detection, audit trails, failure mode analysis.
 */

export { GovernanceGate } from './governance-gate';
export { SecurityReviewGate } from './security-review-gate';
export { PIIDetectionGate } from './pii-detection-gate';
export { AuditTrailGate } from './audit-trail-gate';

export type {
  GateResult,
  GateConfig,
  SecurityReviewConfig,
  GovernanceDecision,
} from './types';
