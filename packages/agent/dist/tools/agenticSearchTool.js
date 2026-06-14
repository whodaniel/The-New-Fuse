"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgenticSearchTool = exports.AgenticSearchToolSchema = void 0;
const zod_1 = require("zod");
exports.AgenticSearchToolSchema = zod_1.z.object({
    query: zod_1.z.string(),
    searchType: zod_1.z.enum(['vector', 'keyword', 'hybrid', 'none']).default('hybrid'),
    topK: zod_1.z.number().int().min(1).max(100).default(5),
    filters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    rerank: zod_1.z.boolean().default(true),
});
class AgenticSearchTool {
    constructor(defaultProvider = 'vector') {
        this.providers = new Map();
        this.defaultProvider = defaultProvider;
    }
    registerProvider(name, provider) {
        this.providers.set(name, provider);
    }
    async search(params) {
        if (params.searchType === 'none') {
            return [];
        }
        const provider = this.providers.get(params.searchType) ?? this.providers.get(this.defaultProvider);
        if (!provider) {
            throw new Error(`No retrieval provider registered for type: ${params.searchType}`);
        }
        let results = await provider.search(params);
        if (params.rerank && results.length > 1) {
            results = this.rerankResults(results, params.query);
        }
        return results.slice(0, params.topK);
    }
    shouldSearch(query) {
        const factualIndicators = [
            /what\s+is/i,
            /who\s+is/i,
            /when\s+did/i,
            /where\s+is/i,
            /how\s+(to|do|does|can)/i,
            /find/i,
            /search/i,
            /lookup/i,
            /explain/i,
            /define/i,
        ];
        const noSearchIndicators = [
            /summarize\s+(this|the\s+above|these)/i,
            /rewrite/i,
            /translate/i,
            /format/i,
            /list\s+(the|all)/i,
        ];
        if (noSearchIndicators.some(p => p.test(query))) {
            return false;
        }
        return factualIndicators.some(p => p.test(query));
    }
    rerankResults(results, query) {
        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        return [...results].sort((a, b) => {
            const aBoost = this.termOverlapScore(a.content, queryTerms);
            const bBoost = this.termOverlapScore(b.content, queryTerms);
            return (b.score + bBoost * 0.1) - (a.score + aBoost * 0.1);
        });
    }
    termOverlapScore(content, terms) {
        const lower = content.toLowerCase();
        return terms.filter(t => lower.includes(t)).length;
    }
}
exports.AgenticSearchTool = AgenticSearchTool;
//# sourceMappingURL=agenticSearchTool.js.map