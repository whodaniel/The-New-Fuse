/**
 * Business Rules-Based Output Evaluator
 * 
 * Evaluates agent outputs against configurable business rules.
 */

import { Logger } from '@the-new-fuse/logger';
import { EvaluationResult, EvaluationFinding, BusinessRule } from './types';

const logger = new Logger({ service: 'business-rules-evaluator' });

export class BusinessRulesEvaluator {
  private rules: BusinessRule[];

  constructor(rules: BusinessRule[]) {
    this.rules = rules.sort((a, b) => b.priority - a.priority);
  }

  evaluate(output: unknown, context?: Record<string, unknown>): EvaluationResult {
    const findings: EvaluationFinding[] = [];
    let passed = true;
    let totalScore = 0;
    let totalWeight = 0;

    for (const rule of this.rules) {
      const result = this.evaluateRule(rule, output, context);
      findings.push(result);
      
      const weight = rule.priority;
      totalWeight += weight;
      
      if (result.status === 'passed') {
        totalScore += weight;
      } else if (result.status === 'failed') {
        passed = false;
      }
      // warnings don't affect pass/fail but reduce score proportionally
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    logger.info('Business rules evaluation completed', {
      ruleCount: this.rules.length,
      passed,
      score: finalScore,
      findingCount: findings.length,
    });

    return {
      passed,
      score: finalScore,
      findings,
      executedAt: new Date().toISOString(),
      evaluator: 'business-rules-evaluator',
    };
  }

  private evaluateRule(
    rule: BusinessRule,
    output: unknown,
    context?: Record<string, unknown>
  ): EvaluationFinding {
    // Placeholder for rule evaluation logic
    // In production, this would parse and execute the rule condition
    const status: 'passed' | 'failed' | 'warning' = 'passed';
    
    return {
      rule: rule.name,
      status,
      message: status === 'passed' ? `Rule "${rule.name}" satisfied` : `Rule "${rule.name}" violated`,
      severity: (status as string) === 'failed' ? 'high' : 'low',
    };
  }
}
