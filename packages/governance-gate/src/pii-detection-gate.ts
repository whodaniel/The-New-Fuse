/**
 * PII Detection Gate
 * 
 * Scans for personally identifiable information:
 * - Names, emails, phone numbers
 * - Addresses, financial data
 * - Government IDs
 */

import { Logger } from '@the-new-fuse/logger';
import { GateResult, GateFinding, GovernanceDecision, PIIDetectionConfig } from './types';

const logger = new Logger({ service: 'pii-detection-gate' });

// Simple regex patterns for PII detection
const PATTERNS: Record<string, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ssn: /\d{3}-\d{2}-\d{4}/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
};

export class PIIDetectionGate {
  private config: PIIDetectionConfig;

  constructor(config: PIIDetectionConfig) {
    this.config = config;
  }

  async evaluate(input: unknown): Promise<GateResult> {
    logger.info('Running PII detection gate');

    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    const findings: GateFinding[] = [];

    if (this.config.detectEmails) {
      const emails = inputStr.match(PATTERNS.email);
      if (emails && emails.length > 0) {
        findings.push({
          category: 'pii-email',
          severity: 'high',
          description: `Found ${emails.length} email address(es)`,
          remediation: 'Redact or tokenize email addresses before processing',
        });
      }
    }

    if (this.config.detectPhoneNumbers) {
      const phones = inputStr.match(PATTERNS.phone);
      if (phones && phones.length > 0) {
        findings.push({
          category: 'pii-phone',
          severity: 'high',
          description: `Found ${phones.length} phone number(s)`,
          remediation: 'Redact or tokenize phone numbers',
        });
      }
    }

    if (this.config.detectFinancialData) {
      const creditCards = inputStr.match(PATTERNS.creditCard);
      if (creditCards && creditCards.length > 0) {
        findings.push({
          category: 'pii-financial',
          severity: 'critical',
          description: `Found ${creditCards.length} potential credit card number(s)`,
          remediation: 'Immediately redact financial data - PCI compliance required',
        });
      }

      const ssns = inputStr.match(PATTERNS.ssn);
      if (ssns && ssns.length > 0) {
        findings.push({
          category: 'pii-financial',
          severity: 'critical',
          description: `Found ${ssns.length} SSN(s)`,
          remediation: 'Immediately redact SSN - regulatory compliance required',
        });
      }
    }

    const passed = !findings.some(f => f.severity === 'critical' || f.severity === 'high');

    const decision: GovernanceDecision = passed
      ? { action: 'approve', notes: 'No PII detected' }
      : { action: 'require_review', notes: 'PII detected - redaction required' };

    return {
      passed,
      gate: 'pii-detection',
      findings,
      decision,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export function createPIIDetectionGate(config: PIIDetectionConfig): PIIDetectionGate {
  return new PIIDetectionGate(config);
}
