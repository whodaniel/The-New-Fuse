"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredSearchAgent = exports.SearchOutputSchema = void 0;
const zod_1 = require("zod");
exports.SearchOutputSchema = zod_1.z.object({
    search_answer: zod_1.z.string().describe('Primary response in plain English'),
    sources: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        url: zod_1.z.string().optional(),
        snippet: zod_1.z.string().optional(),
        relevance_score: zod_1.z.number().min(0).max(1).optional(),
    })).default([]),
    confidence: zod_1.z.number().min(0).max(1).default(0),
    follow_up_queries: zod_1.z.array(zod_1.z.string()).default([]),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
class StructuredSearchAgent {
    constructor(config) {
        this.config = {
            model: config.model,
            temperature: config.temperature ?? 0.2,
            maxTokens: config.maxTokens ?? 2000,
            systemPrompt: config.systemPrompt ?? 'You are a search assistant. Return structured results with a clear answer, sources, and confidence level.',
        };
    }
    getSystemPrompt() {
        return `${this.config.systemPrompt}

You MUST respond with a JSON object matching this schema:
{
  "search_answer": "Your primary answer in plain English",
  "sources": [{ "title": "...", "url": "...", "snippet": "...", "relevance_score": 0.0-1.0 }],
  "confidence": 0.0-1.0,
  "follow_up_queries": ["related query 1", "related query 2"]
}`;
    }
    parseOutput(raw) {
        try {
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return exports.SearchOutputSchema.parse({
                    search_answer: raw,
                    sources: [],
                    confidence: 0,
                    follow_up_queries: [],
                });
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return exports.SearchOutputSchema.parse(parsed);
        }
        catch {
            return exports.SearchOutputSchema.parse({
                search_answer: raw,
                sources: [],
                confidence: 0,
                follow_up_queries: [],
            });
        }
    }
    validateOutput(output) {
        const result = exports.SearchOutputSchema.safeParse(output);
        if (result.success) {
            return { valid: true, errors: [] };
        }
        return {
            valid: false,
            errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
        };
    }
}
exports.StructuredSearchAgent = StructuredSearchAgent;
//# sourceMappingURL=structuredSearchOutput.js.map