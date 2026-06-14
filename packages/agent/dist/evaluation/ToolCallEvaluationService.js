"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ToolCallEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolCallEvaluationService = void 0;
const common_1 = require("@nestjs/common");
let ToolCallEvaluationService = ToolCallEvaluationService_1 = class ToolCallEvaluationService {
    constructor() {
        this.logger = new common_1.Logger(ToolCallEvaluationService_1.name);
        this.sessions = new Map();
    }
    recordToolCall(sessionId, record) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, []);
        }
        const session = this.sessions.get(sessionId);
        const step = session.length + 1;
        const fullRecord = {
            ...record,
            step,
            timestamp: new Date().toISOString(),
        };
        session.push(fullRecord);
        return step;
    }
    getSessionTrace(sessionId) {
        return this.sessions.get(sessionId) || [];
    }
    evaluateStep(record, expectedTool, expectedParams, outputValidator) {
        const toolSelectionCorrect = !expectedTool || record.toolName === expectedTool;
        const toolSelectionReason = toolSelectionCorrect
            ? `Tool '${record.toolName}' matches expected`
            : `Expected '${expectedTool}' but got '${record.toolName}'`;
        let parametersCorrect = true;
        const parametersIssues = [];
        if (expectedParams) {
            for (const [key, expectedValue] of Object.entries(expectedParams)) {
                const actualValue = record.parameters[key];
                if (actualValue !== expectedValue) {
                    parametersCorrect = false;
                    parametersIssues.push(`Param '${key}': expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`);
                }
            }
        }
        let outputInterpretedCorrectly = true;
        const outputIssues = [];
        if (outputValidator) {
            const result = outputValidator(record.output);
            outputInterpretedCorrectly = result.valid;
            outputIssues.push(...result.issues);
        }
        const score = ((toolSelectionCorrect ? 1 : 0) + (parametersCorrect ? 1 : 0) + (outputInterpretedCorrectly ? 1 : 0)) / 3;
        return {
            step: record.step,
            toolName: record.toolName,
            toolSelectionCorrect,
            toolSelectionReason,
            parametersCorrect,
            parametersIssues,
            outputInterpretedCorrectly,
            outputIssues,
            overallScore: score,
        };
    }
    evaluateSession(sessionId, agentId, expectations) {
        const records = this.sessions.get(sessionId) || [];
        const evaluations = [];
        for (const record of records) {
            const expectation = expectations?.find((e) => e.step === record.step);
            const evaluation = this.evaluateStep(record, expectation?.expectedTool, expectation?.expectedParams, expectation?.outputValidator);
            evaluations.push(evaluation);
        }
        const toolSelectionAccuracy = evaluations.length > 0
            ? evaluations.filter((e) => e.toolSelectionCorrect).length / evaluations.length
            : 0;
        const parameterAccuracy = evaluations.length > 0
            ? evaluations.filter((e) => e.parametersCorrect).length / evaluations.length
            : 0;
        const outputInterpretationAccuracy = evaluations.length > 0
            ? evaluations.filter((e) => e.outputInterpretedCorrectly).length / evaluations.length
            : 0;
        const aggregateScore = evaluations.length > 0
            ? evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length
            : 0;
        const recommendations = this.generateRecommendations(evaluations);
        return {
            sessionId,
            agentId,
            totalSteps: records.length,
            evaluations,
            aggregateScore,
            toolSelectionAccuracy,
            parameterAccuracy,
            outputInterpretationAccuracy,
            recommendations,
        };
    }
    clearSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    generateRecommendations(evaluations) {
        const recommendations = [];
        const toolErrors = evaluations.filter((e) => !e.toolSelectionCorrect);
        if (toolErrors.length > 0) {
            recommendations.push(`Tool selection errors in ${toolErrors.length} steps — review available tool registry and selection logic`);
        }
        const paramErrors = evaluations.filter((e) => !e.parametersCorrect);
        if (paramErrors.length > 0) {
            const commonIssues = new Set();
            paramErrors.forEach((e) => e.parametersIssues.forEach((i) => commonIssues.add(i.split(':')[0])));
            recommendations.push(`Parameter errors in ${paramErrors.length} steps — focus on: ${Array.from(commonIssues).join(', ')}`);
        }
        const outputErrors = evaluations.filter((e) => !e.outputInterpretedCorrectly);
        if (outputErrors.length > 0) {
            recommendations.push(`Output interpretation errors in ${outputErrors.length} steps — add output schema validation`);
        }
        if (recommendations.length === 0 && evaluations.length > 0) {
            recommendations.push('All tool calls evaluated positively — consider adding more challenging test scenarios');
        }
        return recommendations;
    }
};
exports.ToolCallEvaluationService = ToolCallEvaluationService;
exports.ToolCallEvaluationService = ToolCallEvaluationService = ToolCallEvaluationService_1 = __decorate([
    (0, common_1.Injectable)()
], ToolCallEvaluationService);
//# sourceMappingURL=ToolCallEvaluationService.js.map