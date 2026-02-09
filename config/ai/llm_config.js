"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLLMConfig = exports.LLMConfig = void 0;
import zod_1 from 'zod';
exports.LLMConfig = zod_1.z.object({
    model: zod_1.z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-2']),
    temperature: zod_1.z.number().min(0).max(2).default(0.7),
    maxTokens: zod_1.z.number().positive().default(2048),
    topP: zod_1.z.number().min(0).max(1).default(1),
    frequencyPenalty: zod_1.z.number().min(-2).max(2).default(0),
    presencePenalty: zod_1.z.number().min(-2).max(2).default(0),
    stopSequences: zod_1.z.array(zod_1.z.string()).optional(),
    apiKey: zod_1.z.string(),
    organizationId: zod_1.z.string().optional(),
});
exports.defaultLLMConfig = {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    apiKey: process.env.OPENAI_API_KEY || '',
};
//# sourceMappingURL=llm_config.js.map