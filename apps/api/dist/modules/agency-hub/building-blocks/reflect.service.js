"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ReflectService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReflectService = void 0;
const common_1 = require("@nestjs/common");
let ReflectService = ReflectService_1 = class ReflectService {
    constructor() {
        this.logger = new common_1.Logger(ReflectService_1.name);
    }
    /**
     * Reflect on agent performance and behavior based on provided metrics.
     */
    async reflectOnPerformance(agentId, metrics) {
        this.logger.log(`Reflecting on performance for agent ${agentId}`);
        const insights = [];
        const recommendations = [];
        let confidenceScore = 1.0;
        const totalTasks = metrics.tasksCompleted + metrics.tasksFailed;
        const successRate = totalTasks > 0 ? metrics.tasksCompleted / totalTasks : 1;
        // Analyze Success Rate
        if (successRate < 0.5) {
            insights.push(`Critical: Success rate is very low (${(successRate * 100).toFixed(1)}%).`);
            recommendations.push('Immediate review of agent task execution logic is required.');
            recommendations.push('Check for systemic errors or environment issues.');
        }
        else if (successRate < 0.8) {
            insights.push(`Success rate is below optimal levels (${(successRate * 100).toFixed(1)}%).`);
            recommendations.push('Analyze failed tasks to identify common failure patterns.');
        }
        else {
            insights.push('Agent success rate is healthy.');
        }
        // Analyze Response Time
        if (metrics.averageResponseTimeMs > 5000) {
            insights.push(`Critical: Response time is excessive (${metrics.averageResponseTimeMs}ms).`);
            recommendations.push('Investigate potential bottlenecks or timeouts.');
            recommendations.push('Consider caching or optimizing external API calls.');
        }
        else if (metrics.averageResponseTimeMs > 2000) {
            insights.push(`Response time is high (${metrics.averageResponseTimeMs}ms).`);
            recommendations.push('Review performance profiling data.');
        }
        // Analyze Feedback
        if (metrics.userFeedbackScore !== undefined) {
            if (metrics.userFeedbackScore < 3.0) {
                insights.push(`User feedback is negative (${metrics.userFeedbackScore}/5).`);
                recommendations.push('Analyze negative feedback for specific complaints.');
                recommendations.push('Adjust agent tone or accuracy thresholds.');
            }
            else if (metrics.userFeedbackScore < 4.0) {
                insights.push(`User feedback is average (${metrics.userFeedbackScore}/5).`);
                recommendations.push('Look for opportunities to delight the user.');
            }
        }
        else {
            confidenceScore *= 0.8; // Lower confidence if feedback is missing
        }
        // Analyze Error Rate
        if (metrics.errorRate !== undefined && metrics.errorRate > 0.1) {
            insights.push(`Error rate is high (${(metrics.errorRate * 100).toFixed(1)}%).`);
            recommendations.push('Implement more robust error handling and retries.');
        }
        // Final Confidence Calculation
        if (totalTasks < 10) {
            confidenceScore *= 0.6; // Low sample size
            insights.push('Data sample size is small; insights may be preliminary.');
        }
        return {
            insights,
            recommendations,
            confidence: parseFloat(confidenceScore.toFixed(2)),
        };
    }
    /**
     * Analyze agent decision-making patterns from a history of decisions.
     */
    async analyzeDecisionPatterns(agentId, decisions) {
        this.logger.log(`Analyzing decision patterns for agent ${agentId}`);
        const patterns = [];
        const improvements = [];
        if (!decisions || decisions.length === 0) {
            return {
                patterns: ['No decision history available.'],
                improvements: ['Enable decision logging to track patterns.'],
            };
        }
        // 1. Analyze Failure Repetition
        let consecutiveFailures = 0;
        let repeatedActionFailures = 0;
        for (let i = 0; i < decisions.length; i++) {
            if (decisions[i].outcome === 'failure') {
                consecutiveFailures++;
                // Check if previous action was same and also failed
                if (i > 0 &&
                    decisions[i - 1].outcome === 'failure' &&
                    decisions[i].action === decisions[i - 1].action) {
                    repeatedActionFailures++;
                }
            }
            else {
                consecutiveFailures = 0;
            }
        }
        if (repeatedActionFailures > 0) {
            patterns.push(`Detected ${repeatedActionFailures} instances of repeating failed actions.`);
            improvements.push('Implement a backoff or alternative strategy when an action fails.');
        }
        // 2. Analyze Confidence Calibration
        const highConfidenceFailures = decisions.filter((d) => d.confidence > 0.8 && d.outcome === 'failure');
        const lowConfidenceSuccesses = decisions.filter((d) => d.confidence < 0.5 && d.outcome === 'success');
        if (highConfidenceFailures.length > 0) {
            patterns.push('Agent exhibits overconfidence in some failed scenarios.');
            improvements.push('Review confidence scoring mechanism for edge cases.');
        }
        if (lowConfidenceSuccesses.length > 0) {
            patterns.push('Agent succeeds even with low confidence.');
            improvements.push('Investigate successful low-confidence actions to refine heuristics.');
        }
        // 3. Action Diversity
        const actions = new Set(decisions.map((d) => d.action));
        if (actions.size === 1 && decisions.length > 5) {
            patterns.push('Agent relies on a single action type.');
            improvements.push('Ensure agent is considering the full range of available tools.');
        }
        if (patterns.length === 0) {
            patterns.push('Decision patterns appear consistent and healthy.');
        }
        return {
            patterns,
            improvements,
        };
    }
    /**
     * Generate self-assessment report.
     * Note: In a full implementation, this would fetch historical data from a repository.
     * Currently, it returns a template structure that can be enriched with real data.
     */
    async generateSelfAssessment(agentId) {
        this.logger.log(`Generating self-assessment for agent ${agentId}`);
        // Placeholder logic - requires persistent storage access to be fully meaningful
        // For now, we return a structural template.
        return {
            strengths: ['Ability to process provided metrics', 'Pattern recognition in decision history'],
            weaknesses: [
                'Lack of long-term memory access (implementation pending)',
                'Limited context awareness outside provided metrics',
            ],
            goals: [
                'Integrate with persistent storage for historical analysis',
                'Improve confidence calibration based on feedback loops',
            ],
        };
    }
};
exports.ReflectService = ReflectService;
exports.ReflectService = ReflectService = ReflectService_1 = __decorate([
    (0, common_1.Injectable)()
], ReflectService);
//# sourceMappingURL=reflect.service.js.map