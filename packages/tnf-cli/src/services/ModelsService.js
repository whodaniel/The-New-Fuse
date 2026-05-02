"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelsService = void 0;
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ModelsService {
    constructor(cachePath) {
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        this.modelsCachePath = cachePath || path.join(os.homedir(), '.cache', 'tnf', 'models.json');
    }
    async listProviders() {
        const providers = [];
        const providerConfigs = [
            { id: 'openai', name: 'OpenAI', envKey: 'OPENAI_API_KEY', baseUrl: 'https://api.openai.com/v1' },
            { id: 'anthropic', name: 'Anthropic', envKey: 'ANTHROPIC_API_KEY', baseUrl: 'https://api.anthropic.com/v1' },
            { id: 'google', name: 'Google AI', envKey: 'GOOGLE_API_KEY', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
            { id: 'deepseek', name: 'DeepSeek', envKey: 'DEEPSEEK_API_KEY', baseUrl: 'https://api.deepseek.com/v1' },
            { id: 'groq', name: 'Groq', envKey: 'GROQ_API_KEY', baseUrl: 'https://api.groq.com/openai/v1' },
            { id: 'openrouter', name: 'OpenRouter', envKey: 'OPENROUTER_API_KEY', baseUrl: 'https://openrouter.ai/api/v1' },
            { id: 'nvidia', name: 'NVIDIA NIM', envKey: 'NVIDIA_API_KEY', baseUrl: 'https://integrate.api.nvidia.com/v1' },
        ];
        for (const config of providerConfigs) {
            const configured = !!process.env[config.envKey];
            const models = configured ? await this.fetchModels(config.id, config.baseUrl, process.env[config.envKey]) : [];
            providers.push({
                id: config.id,
                name: config.name,
                type: 'api',
                configured,
                models,
            });
        }
        return providers;
    }
    async listModels(providerId, options = {}) {
        if (!options.refresh) {
            const cached = this.loadCache();
            if (cached && cached.provider === providerId && Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.models;
            }
        }
        const providers = await this.listProviders();
        if (providerId) {
            const provider = providers.find(p => p.id === providerId);
            return provider?.models || [];
        }
        const allModels = [];
        for (const provider of providers) {
            allModels.push(...provider.models);
        }
        this.saveCache(providerId || 'all', allModels);
        return allModels;
    }
    async fetchModels(providerId, baseUrl, apiKey) {
        try {
            let url;
            let headers;
            if (providerId === 'google' || providerId === 'gemini') {
                url = `${baseUrl}/models?key=${apiKey}`;
                headers = {};
            }
            else {
                url = `${baseUrl}/models`;
                headers = { Authorization: `Bearer ${apiKey}` };
            }
            const response = await fetch(url, { headers });
            if (!response.ok)
                return [];
            const data = await response.json();
            if (Array.isArray(data.data)) {
                return data.data.map((m) => ({
                    id: m.id,
                    name: m.id,
                    provider: providerId,
                    contextWindow: m.context_window,
                    maxOutput: m.max_output_tokens,
                    inputCost: m.pricing?.input ? parseFloat(m.pricing.input) * 1000000 : undefined,
                    outputCost: m.pricing?.output ? parseFloat(m.pricing.output) * 1000000 : undefined,
                    features: m.features,
                }));
            }
            if (Array.isArray(data.models)) {
                return data.models.map((m) => ({
                    id: m.name.replace('models/', ''),
                    name: m.displayName || m.name.replace('models/', ''),
                    provider: providerId,
                    contextWindow: m.inputTokenLimit,
                    maxOutput: m.outputTokenLimit,
                    features: m.supportedGenerationMethods,
                }));
            }
            return [];
        }
        catch {
            return [];
        }
    }
    loadCache() {
        if (!fs.existsSync(this.modelsCachePath))
            return null;
        try {
            return JSON.parse(fs.readFileSync(this.modelsCachePath, 'utf8'));
        }
        catch {
            return null;
        }
    }
    saveCache(provider, models) {
        const dir = path.dirname(this.modelsCachePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.modelsCachePath, JSON.stringify({
            provider,
            models,
            timestamp: Date.now(),
        }, null, 2));
    }
    async refreshCache() {
        return this.listModels(undefined, { refresh: true });
    }
}
exports.ModelsService = ModelsService;
//# sourceMappingURL=ModelsService.js.map