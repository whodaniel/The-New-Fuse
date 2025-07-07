"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    llm: {
        provider: process.env.LLM_PROVIDER || 'openai',
        openai: {
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4',
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        },
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY,
            model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
            maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4000'),
            temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
        },
    },
});
