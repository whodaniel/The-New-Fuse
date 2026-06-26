/**
 * Versa Labs AI Security Testing Bridge
 *
 * Integrates Versa Labs tooling into TNF AI pipelines for:
 * - Adversarial prompt testing
 * - Model response safety evaluation
 * - Application logic vulnerability scanning
 * - Pre-deployment security weakness identification
 *
 * @see https://versalabs.ai/security-testing
 */

import { Logger } from '@the-new-fuse/logger';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityAuditResult {
  severity?: AuditSeverity;
  findings: Array<{
    id?: string;
    category?: string;
    description: string;
    severity: AuditSeverity;
    remediation?: string;
  }>;
  summary?: string;
  passed?: boolean;
  [key: string]: unknown;
}

const logger = new Logger({ service: 'versa-labs-adapter' });

export interface VersaLabsConfig {
  apiKey: string;
  endpoint: string;
  workflows: string[];
}

export interface VersaLabsTestRequest {
  workflow: string;
  target: {
    type: 'prompt' | 'model_response' | 'application_logic';
    payload: string;
  };
  adversarialScenarios?: string[];
}

export interface VersaLabsTestResponse {
  testId: string;
  workflow: string;
  status: 'passed' | 'failed' | 'warning';
  findings: SecurityFinding[];
  executedAt: string;
}

export interface SecurityFinding {
  id: string;
  severity: AuditSeverity;
  category: 'prompt_injection' | 'data_leak' | 'unsafe_behavior' | 'logic_flaw';
  description: string;
  remediation?: string;
  evidence?: Record<string, unknown>;
}

export class VersaLabsAdapter {
  private config: VersaLabsConfig;
  private initialized: boolean = false;

  constructor(config: VersaLabsConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('VersaLabsAdapter: API key required');
    }
    if (!this.config.endpoint) {
      throw new Error('VersaLabsAdapter: Endpoint required');
    }
    this.initialized = true;
    logger.info('VersaLabsAdapter initialized', {
      workflows: this.config.workflows,
      endpoint: this.config.endpoint,
    });
  }

  async executeTest(request: VersaLabsTestRequest): Promise<VersaLabsTestResponse> {
    if (!this.initialized) {
      throw new Error('VersaLabsAdapter not initialized. Call initialize() first.');
    }

    const testId = `vl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    logger.info('Executing Versa Labs security test', {
      testId,
      workflow: request.workflow,
      targetType: request.target.type,
    });

    const response = await fetch(`${this.config.endpoint.replace(/\/+$/, '')}/v1/tests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow: request.workflow,
        target: request.target,
        adversarialScenarios: request.adversarialScenarios || [],
      }),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`Versa Labs API request failed (${response.status}): ${detail}`);
    }

    const payload = (await response.json()) as VersaLabsTestResponse;
    logger.info('Versa Labs test completed', {
      testId: payload.testId || testId,
      status: payload.status,
      findingCount: payload.findings?.length || 0,
    });

    return {
      ...payload,
      testId: payload.testId || testId,
      executedAt: payload.executedAt || new Date().toISOString(),
    };
  }

  async executeWorkflow(
    workflowName: string,
    targets: Array<{ type: string; payload: string }>
  ): Promise<SecurityAuditResult> {
    const workflow = this.config.workflows.find((w) => w === workflowName);

    if (!workflow) {
      throw new Error(
        `Workflow '${workflowName}' not found in configured workflows: ${this.config.workflows.join(', ')}`
      );
    }

    const results: VersaLabsTestResponse[] = [];

    for (const target of targets) {
      const result = await this.executeTest({
        workflow: workflowName,
        target: {
          type: target.type as 'prompt' | 'model_response' | 'application_logic',
          payload: target.payload,
        },
      });
      results.push(result);
    }

    const allFindings = results.flatMap((r) => r.findings);
    const criticalCount = allFindings.filter((f) => f.severity === 'critical').length;
    const highCount = allFindings.filter((f) => f.severity === 'high').length;

    return {
      auditId: `audit-${Date.now()}`,
      service: 'versa-labs-adapter',
      status: criticalCount > 0 ? 'failed' : highCount > 0 ? 'warning' : 'passed',
      findings: allFindings.map((f) => ({
        severity: f.severity,
        category: f.category,
        description: f.description,
        remediation: f.remediation,
      })),
      executedAt: new Date().toISOString(),
      metadata: {
        workflow: workflowName,
        testCount: results.length,
        versaLabsTestIds: results.map((r) => r.testId),
      },
    };
  }
}

export function createVersaLabsAdapter(config: VersaLabsConfig): VersaLabsAdapter {
  return new VersaLabsAdapter(config);
}
