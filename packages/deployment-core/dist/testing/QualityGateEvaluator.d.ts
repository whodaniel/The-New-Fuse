import { Logger } from 'winston';
import { TestSummaryReport } from './TestRunner.js';
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
export declare class QualityGateEvaluator {
    private logger;
    constructor(logger: Logger);
    /**
     * Evaluate a quality gate against test summary
     */
    evaluate(gate: QualityGateConfig, summary: TestSummaryReport): Promise<QualityGateResult>;
    /**
     * Evaluate multiple quality gates
     */
    evaluateAll(gates: QualityGateConfig[], summary: TestSummaryReport): Promise<QualityGateResult[]>;
    private extractValue;
    private evaluateCondition;
    private generateMessage;
}
//# sourceMappingURL=QualityGateEvaluator.d.ts.map