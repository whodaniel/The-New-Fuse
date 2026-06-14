"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionSafetyService = exports.ProductionSafetyConfigSchema = void 0;
const zod_1 = require("zod");
exports.ProductionSafetyConfigSchema = zod_1.z.object({
    agentRequestLimit: zod_1.z.number().int().min(1).max(1000).default(50),
    readmaxLines: zod_1.z.number().int().min(10).max(100000).default(500),
    maxConcurrentAgents: zod_1.z.number().int().min(1).max(100).default(10),
    timeoutMs: zod_1.z.number().int().min(1000).max(300000).default(30000),
    maxRetries: zod_1.z.number().int().min(0).max(10).default(3),
    maxTokenBudget: zod_1.z.number().int().min(1000).max(10_000_000).default(100_000),
    enableSafetyLogging: zod_1.z.boolean().default(true),
    haltOnCriticalFailure: zod_1.z.boolean().default(true),
});
class ProductionSafetyService {
    constructor(config) {
        this.requestCounts = new Map();
        this.violations = [];
        this.activeAgents = new Set();
        this.config = exports.ProductionSafetyConfigSchema.parse(config ?? {});
    }
    checkRequestLimit(agentId) {
        const current = (this.requestCounts.get(agentId) ?? 0) + 1;
        if (current > this.config.agentRequestLimit) {
            this.recordViolation({
                rule: 'agent_request_limit',
                current,
                limit: this.config.agentRequestLimit,
                timestamp: Date.now(),
                agentId,
            });
            return false;
        }
        this.requestCounts.set(agentId, current);
        return true;
    }
    checkConcurrentAgents(agentId) {
        if (this.activeAgents.size >= this.config.maxConcurrentAgents && !this.activeAgents.has(agentId)) {
            this.recordViolation({
                rule: 'max_concurrent_agents',
                current: this.activeAgents.size,
                limit: this.config.maxConcurrentAgents,
                timestamp: Date.now(),
                agentId,
            });
            return false;
        }
        this.activeAgents.add(agentId);
        return true;
    }
    checkTokenBudget(estimatedTokens) {
        const totalUsed = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0) * 1000;
        if (totalUsed + estimatedTokens > this.config.maxTokenBudget) {
            this.recordViolation({
                rule: 'max_token_budget',
                current: totalUsed + estimatedTokens,
                limit: this.config.maxTokenBudget,
                timestamp: Date.now(),
            });
            return false;
        }
        return true;
    }
    truncateOutput(content) {
        const lines = content.split('\n');
        if (lines.length > this.config.readmaxLines) {
            return lines.slice(0, this.config.readmaxLines).join('\n') + `\n... [truncated at ${this.config.readmaxLines} lines]`;
        }
        return content;
    }
    releaseAgent(agentId) {
        this.activeAgents.delete(agentId);
        this.requestCounts.delete(agentId);
    }
    resetCounters() {
        this.requestCounts.clear();
        this.activeAgents.clear();
    }
    getViolations() {
        return [...this.violations];
    }
    getConfig() {
        return this.config;
    }
    recordViolation(violation) {
        this.violations.push(violation);
        if (this.violations.length > 10000) {
            this.violations.splice(0, this.violations.length - 10000);
        }
        if (this.config.enableSafetyLogging) {
            console.warn(`[ProductionSafety] Violation: ${violation.rule} | current=${violation.current} limit=${violation.limit} agent=${violation.agentId ?? 'N/A'}`);
        }
        if (this.config.haltOnCriticalFailure && violation.rule === 'agent_request_limit') {
            console.error(`[ProductionSafety] Critical: Agent ${violation.agentId} exceeded request limit. Halting.`);
        }
    }
}
exports.ProductionSafetyService = ProductionSafetyService;
//# sourceMappingURL=productionSafety.js.map