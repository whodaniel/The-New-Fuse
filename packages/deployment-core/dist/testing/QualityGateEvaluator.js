"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityGateEvaluator = void 0;
/**
 * QualityGateEvaluator evaluates test results against defined quality gates
 */
class QualityGateEvaluator {
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Evaluate a quality gate against test summary
     */
    async evaluate(gate, summary) {
        this.logger.debug(`Evaluating quality gate: ${gate.name}`, {
            gateId: gate.id,
            type: gate.type,
            threshold: gate.threshold
        });
        const actualValue = this.extractValue(gate.type, summary);
        const passed = this.evaluateCondition(actualValue, gate.threshold, gate.operator);
        const result = {
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
    async evaluateAll(gates, summary) {
        const results = [];
        for (const gate of gates) {
            const result = await this.evaluate(gate, summary);
            results.push(result);
        }
        return results;
    }
    // Private helper methods
    extractValue(type, summary) {
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
    evaluateCondition(actualValue, threshold, operator) {
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
    generateMessage(gate, actualValue, passed) {
        const status = passed ? 'PASSED' : 'FAILED';
        return `${gate.name} ${status}: ${actualValue} ${gate.operator.replace('_', ' ')} ${gate.threshold}`;
    }
}
exports.QualityGateEvaluator = QualityGateEvaluator;
//# sourceMappingURL=QualityGateEvaluator.js.map