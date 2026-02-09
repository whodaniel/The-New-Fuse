import { Logger } from 'winston';
import { TestSummaryReport } from './TestRunner';

/**
 * Quality gate evaluation result
 */
export interface QualityGateResult {
  gateId: string;
  name: string;
  type: string;
  passed: boolean;
  required: boolean;
  threshold: number;
  actualValue: number;
  operator: string;
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Quality gate configuration interface
 */
export interface QualityGateConfig {
  id: string;
  name: string;
  type: 'coverage' | 'success_rate' | 'performance' | 'security' | 'custom';
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  required: boolean;
  failureBehavior: 'fail' | 'warn' | 'ignore';
  scope: 'stage' | 'plan' | 'test_type';
  conditions: QualityGateCondition[];
}

export interface QualityGateCondition {
  type: 'test_type' | 'stage' | 'environment';
  value: string;
}

/**
 * QualityGateEvaluator evaluates test results against defined quality gates
 */
export class QualityGateEvaluator {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Evaluate a quality gate against test summary
   */
  async evaluate(
    gate: QualityGateConfig, 
    summary: TestSummaryReport
  ): Promise<QualityGateResult> {
    this.logger.debug(`Evaluating quality gate: ${gate.name}`, {
      gateId: gate.id,
      type: gate.type,
      threshold: gate.threshold
    });

    const actualValue = this.extractValue(gate.type, summary);
    const passed = this.evaluateCondition(actualValue, gate.threshold, gate.operator);

    const result: QualityGateResult = {
      gateId: gate.id,
      name: gate.name,
      type: gate.type,
      passed,
      required: gate.required,
      threshold: gate.threshold,
      actualValue,
      operator: gate.operator,
      message: this.generateMessage(gate, actualValue, passed),
      timestamp: new Date(),
      metadata: {
        scope: gate.scope,
        failureBehavior: gate.failureBehavior
      }
    };

    this.logger.info(`Quality gate evaluation completed: ${gate.name}`, {
      gateId: gate.id,
      passed,
      actualValue,
      threshold: gate.threshold
    });

    return result;
  }

  /**
   * Evaluate multiple quality gates
   */
  async evaluateAll(
    gates: QualityGateConfig[], 
    summary: TestSummaryReport
  ): Promise<QualityGateResult[]> {
    const results: QualityGateResult[] = [];

    for (const gate of gates) {
      const result = await this.evaluate(gate, summary);
      results.push(result);
    }

    return results;
  }

  // Private helper methods

  private extractValue(type: string, summary: TestSummaryReport): number {
    switch (type) {
      case 'coverage':
        return summary.coverage?.summary.percentage || 0;
      case 'success_rate':
        return summary.successRate * 100;
      case 'performance':
        return summary.totalDuration;
      default:
        return 0;
    }
  }

  private evaluateCondition(
    actualValue: number, 
    threshold: number, 
    operator: string
  ): boolean {
    switch (operator) {
      case 'greater_than':
        return actualValue > threshold;
      case 'less_than':
        return actualValue < threshold;
      case 'equals':
        return actualValue === threshold;
      default:
        return false;
    }
  }

  private generateMessage(
    gate: QualityGateConfig, 
    actualValue: number, 
    passed: boolean
  ): string {
    const status = passed ? 'PASSED' : 'FAILED';
    return `${gate.name} ${status}: ${actualValue} ${gate.operator.replace('_', ' ')} ${gate.threshold}`;
  }
}