import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
export class ModelService {
    constructor() {
        this.configDir = path.join(os.homedir(), '.tnf', 'models');
        this.modelsFile = path.join(this.configDir, 'models.json');
        this.providersFile = path.join(this.configDir, 'providers.json');
        this.ensureDefaults();
    }
    ensureDefaults() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        if (!fs.existsSync(this.modelsFile)) {
            this.saveModels(this.defaultModels());
        }
        if (!fs.existsSync(this.providersFile)) {
            this.saveProviders(this.defaultProviders());
        }
    }
    defaultModels() {
        return [
            { id: 'mo-default', name: 'Default System', provider: 'openrouter', model: 'openrouter/auto', apiKeyEnv: 'OPENROUTER_API_KEY', enabled: true, isDefault: true, description: 'Auto-selected by OpenRouter' },
            { id: 'mo-gpt4o', name: 'GPT-4o', provider: 'openai', model: 'gpt-4o', apiKeyEnv: 'OPENAI_API_KEY', enabled: true, isDefault: false, supportsVision: true, supportsFunctionCalling: true, costPer1K: 0.005 },
            { id: 'mo-claude35', name: 'Claude 3.5 Sonnet', provider: 'anthropic', model: 'claude-3-5-sonnet-20240620', apiKeyEnv: 'ANTHROPIC_API_KEY', enabled: true, isDefault: false, supportsVision: true, supportsFunctionCalling: true, costPer1K: 0.003 },
            { id: 'mo-llama70b', name: 'Llama 3.1 70B', provider: 'openrouter', model: 'meta-llama/llama-3.1-70b-instruct', apiKeyEnv: 'OPENROUTER_API_KEY', enabled: true, isDefault: false, costPer1K: 0.0007 },
        ];
    }
    defaultProviders() {
        return [
            { name: 'openrouter', type: 'openrouter', authType: 'api-key', status: 'active', models: [] },
            { name: 'openai', type: 'openai', authType: 'api-key', status: 'active', models: [] },
            { name: 'anthropic', type: 'anthropic', authType: 'api-key', status: 'active', models: [] },
        ];
    }
    loadModels() {
        try {
            return JSON.parse(fs.readFileSync(this.modelsFile, 'utf8'));
        }
        catch {
            return this.defaultModels();
        }
    }
    saveModels(models) {
        fs.writeFileSync(this.modelsFile, JSON.stringify(models, null, 2));
    }
    loadProviders() {
        try {
            return JSON.parse(fs.readFileSync(this.providersFile, 'utf8'));
        }
        catch {
            return this.defaultProviders();
        }
    }
    saveProviders(providers) {
        fs.writeFileSync(this.providersFile, JSON.stringify(providers, null, 2));
    }
    async listModels() {
        return this.loadModels();
    }
    async getModel(id) {
        return this.loadModels().find(m => m.id === id);
    }
    async getDefaultModel() {
        return this.loadModels().find(m => m.isDefault);
    }
    async setDefault(modelId) {
        const models = this.loadModels();
        const target = models.find(m => m.id === modelId);
        if (!target)
            return null;
        models.forEach(m => m.isDefault = false);
        target.isDefault = true;
        this.saveModels(models);
        return target;
    }
    async addModel(config) {
        const models = this.loadModels();
        const newModel = { ...config, id: `mo-${Date.now()}` };
        models.push(newModel);
        this.saveModels(models);
        return newModel;
    }
    async removeModel(modelId) {
        const models = this.loadModels();
        const idx = models.findIndex(m => m.id === modelId);
        if (idx === -1)
            return false;
        models.splice(idx, 1);
        this.saveModels(models);
        return true;
    }
    // Fallback chain management
    async getFallbackChain() {
        const models = this.loadModels();
        return models.filter(m => m.enabled && !m.isDefault).sort((a, b) => (a.latency || 999) - (b.latency || 999));
    }
    async addToFallback(modelId) {
        const models = this.loadModels();
        const model = models.find(m => m.id === modelId);
        if (!model)
            return false;
        model.enabled = true;
        this.saveModels(models);
        return true;
    }
    async removeFromFallback(modelId) {
        const models = this.loadModels();
        const model = models.find(m => m.id === modelId);
        if (!model)
            return false;
        model.enabled = false;
        this.saveModels(models);
        return true;
    }
    async getProviderStatus() {
        return this.loadProviders();
    }
    async testProvider(provider) {
        const start = Date.now();
        // Simplified test - in production would actually ping the API
        return { status: 'active', latency: Date.now() - start };
    }
}
//# sourceMappingURL=ModelService.js.map