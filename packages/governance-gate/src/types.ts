export interface GateResult {
  passed: boolean;
  gate: string;
  findings: GateFinding[];
  decision: GovernanceDecision;
  evaluatedAt: string;
}

export interface GateFinding {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  remediation?: string;
}

export interface GovernanceDecision {
  action: 'approve' | 'reject' | 'require_review' | 'conditional_approve';
  conditions?: string[];
  reviewer?: string;
  notes?: string;
}

export interface GateConfig {
  strictMode: boolean;
  autoApproveThreshold: number;
  requireHumanReview: boolean;
}

export interface SecurityReviewConfig extends GateConfig {
  checkAdversarialResistance: boolean;
  checkDataLeakage: boolean;
  checkPromptInjection: boolean;
}

export interface PIIDetectionConfig extends GateConfig {
  detectNames: boolean;
  detectEmails: boolean;
  detectPhoneNumbers: boolean;
  detectAddresses: boolean;
  detectFinancialData: boolean;
}
