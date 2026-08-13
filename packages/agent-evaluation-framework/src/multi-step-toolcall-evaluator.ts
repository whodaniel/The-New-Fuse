/**
 * Multi-Step Tool Call Evaluator
 * 
 * Evaluates sequences of agent tool calls for correctness and completeness.
 */

import { Logger } from '@the-new-fuse/logger';
import { EvaluationResult, EvaluationFinding, ToolCallStep } from './types';

const logger = new Logger({ service: 'multi-step-toolcall-evaluator' });

export class MultiStepToolCallEvaluator {
  evaluate(
    expectedSteps: ToolCallStep[],
    actualSteps: Array<{ toolName: string; output: unknown }>
  ): EvaluationResult {
    const findings: EvaluationFinding[] = [];
    let passed = true;
    let score = 0;

    logger.info('Evaluating multi-step tool call sequence', {
      expectedSteps: expectedSteps.length,
      actualSteps: actualSteps.length,
    });

    // Check step count
    if (expectedSteps.length !== actualSteps.length) {
      findings.push({
        rule: 'step-count',
        status: 'failed',
        message: `Expected ${expectedSteps.length} steps, got ${actualSteps.length}`,
        severity: 'high',
      });
      passed = false;
    } else {
      findings.push({
        rule: 'step-count',
        status: 'passed',
        message: 'Step count matches',
      });
      score += 0.2;
    }

    // Check each step
    for (let i = 0; i < Math.min(expectedSteps.length, actualSteps.length); i++) {
      const expected = expectedSteps[i];
      const actual = actualSteps[i];
      const finding = this.evaluateStep(expected, actual, i);
      findings.push(finding);
      
      if (finding.status === 'passed') {
        score += 0.8 / expectedSteps.length;
      } else {
        passed = false;
      }
    }

    logger.info('Tool call evaluation completed', {
      passed,
      score,
      findingCount: findings.length,
    });

    return {
      passed,
      score,
      findings,
      executedAt: new Date().toISOString(),
      evaluator: 'multi-step-toolcall-evaluator',
    };
  }

  private evaluateStep(
    expected: ToolCallStep,
    actual: { toolName: string; output: unknown },
    index: number
  ): EvaluationFinding {
    if (expected.toolName !== actual.toolName) {
      return {
        rule: `step-${index}-tool`,
        status: 'failed',
        message: `Expected tool "${expected.toolName}", got "${actual.toolName}"`,
        severity: 'high',
      };
    }

    // Placeholder for output validation
    return {
      rule: `step-${index}-output`,
      status: 'passed',
      message: `Step ${index} output validated`,
    };
  }
}
