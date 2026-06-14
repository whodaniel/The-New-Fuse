"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builtInEvalCases = exports.CodeEvalSuite = void 0;
const zod_1 = require("zod");
class CodeEvalSuite {
    constructor() {
        this.cases = new Map();
    }
    register(evalCase) {
        this.cases.set(evalCase.id, evalCase);
    }
    async run(evalId, output) {
        const evalCase = this.cases.get(evalId);
        if (!evalCase) {
            return {
                passed: false,
                score: 0,
                details: `Eval case "${evalId}" not found`,
                category: 'deterministic',
            };
        }
        return evalCase.validate(output);
    }
    async runAll(output) {
        const results = [];
        for (const [id] of this.cases) {
            results.push(await this.run(id, output));
        }
        return results;
    }
    listCases() {
        return Array.from(this.cases.values()).map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
        }));
    }
}
exports.CodeEvalSuite = CodeEvalSuite;
exports.builtInEvalCases = [
    {
        id: 'json-valid',
        name: 'Valid JSON Output',
        description: 'Checks that output is valid JSON',
        inputSchema: zod_1.z.string(),
        validate: (output) => {
            if (typeof output !== 'string') {
                return { passed: false, score: 0, details: 'Output is not a string', category: 'deterministic' };
            }
            try {
                JSON.parse(output);
                return { passed: true, score: 1, details: 'Valid JSON', category: 'deterministic' };
            }
            catch {
                return { passed: false, score: 0, details: 'Invalid JSON', category: 'deterministic' };
            }
        },
    },
    {
        id: 'no-pii',
        name: 'No PII in Output',
        description: 'Checks that output does not contain PII patterns',
        inputSchema: zod_1.z.string(),
        validate: (output) => {
            if (typeof output !== 'string') {
                return { passed: true, score: 1, details: 'Non-string output, PII check skipped', category: 'heuristic' };
            }
            const piiPatterns = [
                /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/,
                /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
                /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
            ];
            const matches = piiPatterns.filter((p) => p.test(output));
            if (matches.length > 0) {
                return { passed: false, score: 0, details: `PII patterns detected: ${matches.length}`, category: 'heuristic' };
            }
            return { passed: true, score: 1, details: 'No PII detected', category: 'heuristic' };
        },
    },
    {
        id: 'non-empty',
        name: 'Non-Empty Output',
        description: 'Checks that output is not empty or whitespace-only',
        inputSchema: zod_1.z.string(),
        validate: (output) => {
            if (typeof output !== 'string') {
                return { passed: false, score: 0, details: 'Output is not a string', category: 'deterministic' };
            }
            if (output.trim().length === 0) {
                return { passed: false, score: 0, details: 'Output is empty or whitespace-only', category: 'deterministic' };
            }
            return { passed: true, score: 1, details: `Output length: ${output.length}`, category: 'deterministic' };
        },
    },
    {
        id: 'within-length',
        name: 'Within Length Bounds',
        description: 'Checks that output length is within configurable bounds',
        inputSchema: zod_1.z.string(),
        validate: (output) => {
            if (typeof output !== 'string') {
                return { passed: false, score: 0, details: 'Output is not a string', category: 'structural' };
            }
            const maxLength = 10000;
            if (output.length > maxLength) {
                return { passed: false, score: 0.5, details: `Output exceeds max length (${output.length} > ${maxLength})`, category: 'structural' };
            }
            return { passed: true, score: 1, details: `Output within bounds (${output.length} chars)`, category: 'structural' };
        },
    },
];
//# sourceMappingURL=codeEvals.js.map