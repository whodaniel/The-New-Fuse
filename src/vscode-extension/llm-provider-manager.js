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
exports.LLMProviderManager = void 0;
exports.createLLMProviderManager = createLLMProviderManager;
const vscode = __importStar(require("vscode"));
const performance_utils_1 = require("./utils/performance-utils");
// Add worker support using web workers when in browser context or worker_threads in Node.js
let Worker;
try {
    Worker = require('worker_threads').Worker;
}
catch (e) {
    // In browser context or when worker_threads is not available
    Worker = class MockWorker {
        constructor(path) {
            console.warn('Worker threads not supported in this environment');
        }
        postMessage(data) { }
        on(event, callback) { }
        terminate() { }
    };
}
/**
 * LLMProviderManager handles the registration, selection, and management
 * of LLM providers within the VS Code extension.
 */
class LLMProviderManager {
    constructor(context, outputChannel) {
        this.providers = new Map();
        this.onProviderChangedEmitter = new vscode.EventEmitter();
        this.workerPool = [];
        this.responseCache = new Map();
        this.telemetryEvents = [];
        this.isProcessingQueue = false;
        this.requestQueue = [];
        this.onProviderChanged = this.onProviderChangedEmitter.event;
        /**
         * Flush telemetry events
         */
        this.flushTelemetry = (0, performance_utils_1.debounce)(() => {
            if (this.telemetryEvents.length === 0) {
                return;
            }
            const events = [...this.telemetryEvents];
            this.telemetryEvents = [];
            // In a real implementation, this would send the events to a telemetry service
            this.log(`Flushing ${events.length} telemetry events`);
        }, 1000);
        this.context = context;
        this.outputChannel = outputChannel;
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'thefuse.selectLLMProvider';
        this.statusBarItem.tooltip = 'Select LLM Provider';
        context.subscriptions.push(this.statusBarItem);
        // Register commands
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.selectLLMProvider', this.showProviderSelectionQuickPick.bind(this)));
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.addCustomLLMProvider', this.showAddCustomProviderQuickPick.bind(this)));
        context.subscriptions.push(vscode.commands.registerCommand('thefuse.manageLLMProviders', this.showManageProvidersQuickPick.bind(this)));
        // Initialize default providers
        this.initializeDefaultProviders();
        // Show in status bar
        this.updateStatusBar();
        this.statusBarItem.show();
        // Initialize the worker pool for concurrent processing
        this.initializeWorkerPool();
        // Configure response caching
        this.setupResponseCaching();
        // Start the queue processor
        this.processQueue();
        // Add telemetry event flushing
        this.setupTelemetry();
    }
    /**
     * Initialize the default LLM providers
     */
    async initializeDefaultProviders() {
        try {
            this.log('Initializing default LLM providers');
            // Register VS Code Copilot provider if available
            const isVSCodeCopilotAvailable = await this.checkCopilotAvailability();
            if (isVSCodeCopilotAvailable) {
                this.log('GitHub Copilot is available, adding as provider');
                this.registerProvider({
                    id: 'vscode-copilot',
                    name: 'GitHub Copilot',
                    provider: lm_api_bridge_1.LLMProvider.VSCode,
                    modelName: 'copilot',
                    isDefault: true,
                    isBuiltin: true
                });
            }
            else {
                this.log('GitHub Copilot is not available');
            }
            // Load saved custom providers from extension storage
            try {
                const customProviders = this.context.globalState.get('thefuse.customLLMProviders', []);
                for (const provider of customProviders) {
                    if (!this.providers.has(provider.id)) {
                        this.log(`Loading custom provider: ${provider.name}`);
                        this.registerProvider({
                            ...provider,
                            isCustom: true,
                            isBuiltin: false
                        });
                    }
                }
            }
            catch (err) {
                this.log(`Failed to load custom LLM providers: ${err instanceof Error ? err.message : String(err)}`);
            }
            // Add standard provider configurations
            this.registerProvider({
                id: 'openai-gpt4',
                name: 'OpenAI GPT-4',
                provider: lm_api_bridge_1.LLMProvider.OpenAI,
                modelName: 'gpt-4',
                isDefault: !isVSCodeCopilotAvailable,
                isBuiltin: true
            });
            this.registerProvider({
                id: 'openai-gpt35',
                name: 'OpenAI GPT-3.5 Turbo',
                provider: lm_api_bridge_1.LLMProvider.OpenAI,
                modelName: 'gpt-3.5-turbo',
                isBuiltin: true
            });
            this.registerProvider({
                id: 'anthropic-claude3',
                name: 'Anthropic Claude 3 Opus',
                provider: lm_api_bridge_1.LLMProvider.Anthropic,
                modelName: 'claude-3-opus-20240229',
                isBuiltin: true
            });
            this.registerProvider({
                id: 'anthropic-claude3-sonnet',
                name: 'Anthropic Claude 3 Sonnet',
                provider: lm_api_bridge_1.LLMProvider.Anthropic,
                modelName: 'claude-3-sonnet-20240229',
                isBuiltin: true
            });
            // Select default provider
            const defaultProvider = Array.from(this.providers.values()).find(p => p.isDefault);
            if (defaultProvider) {
                this.selectProvider(defaultProvider.id);
            }
            else if (this.providers.size > 0) {
                this.selectProvider(this.providers.values().next().value.id);
            }
            this.log(`Initialized ${this.providers.size} LLM providers`);
        }
        catch (err) {
            this.log(`Error initializing LLM providers: ${err instanceof Error ? err.message : String(err)}`);
            vscode.window.showErrorMessage('Failed to initialize LLM providers');
        }
    }
    /**
     * Check if GitHub Copilot is available in the current VS Code instance
     */
    async checkCopilotAvailability() {
        try {
            const extensions = vscode.extensions.all;
            const copilotExtension = extensions.find(ext => ext.id === 'GitHub.copilot' ||
                ext.id === 'GitHub.copilot-chat');
            if (!copilotExtension) {
                return false;
            }
            // Try to execute a Copilot command to check if it's active
            try {
                await vscode.commands.executeCommand('github.copilot.generate', { prompt: 'test' });
                return true;
            }
            catch (e) {
                // The command might fail but still exist
                return true;
            }
        }
        catch (err) {
            return false;
        }
    }
    /**
     * Register a new LLM provider
     */
    registerProvider(provider) {
        this.providers.set(provider.id, provider);
        this.updateStatusBar();
        // If this is the only provider, select it
        if (this.providers.size === 1) {
            this.selectProvider(provider.id);
        }
        return provider;
    }
    /**
     * Get a provider by ID
     */
    getProvider(id) {
        return this.providers.get(id);
    }
    /**
     * Get all registered providers
     */
    getAllProviders() {
        return Array.from(this.providers.values());
    }
    /**
     * Get the currently selected provider
     */
    getSelectedProvider() {
        return this.selectedProviderId ? this.providers.get(this.selectedProviderId) : undefined;
    }
    /**
     * Select a provider by ID
     */
    selectProvider(id) {
        const provider = this.providers.get(id);
        if (!provider) {
            this.log(`Provider with id ${id} not found`);
            return false;
        }
        this.selectedProviderId = id;
        this.updateStatusBar();
        this.onProviderChangedEmitter.fire(id);
        // Update default LM provider in extension settings
        vscode.workspace.getConfiguration('theFuse').update('defaultLmProvider', provider.provider, vscode.ConfigurationTarget.Global);
        this.log(`Selected LLM provider: ${provider.name} (${id})`);
        return true;
    }
    /**
     * Remove a provider by ID
     */
    removeProvider(id) {
        const provider = this.providers.get(id);
        if (!provider) {
            return false;
        }
        // Don't allow removing built-in providers
        if (provider.isBuiltin) {
            vscode.window.showWarningMessage(`Cannot remove built-in provider ${provider.name}`);
            return false;
        }
        this.providers.delete(id);
        // Update custom providers in storage
        this.saveCustomProviders();
        // If the removed provider was selected, select another one
        if (this.selectedProviderId === id) {
            const defaultProvider = Array.from(this.providers.values()).find(p => p.isDefault);
            if (defaultProvider) {
                this.selectProvider(defaultProvider.id);
            }
            else if (this.providers.size > 0) {
                this.selectProvider(this.providers.values().next().value.id);
            }
            else {
                this.selectedProviderId = undefined;
            }
        }
        this.updateStatusBar();
        return true;
    }
    /**
     * Save custom providers to extension storage
     */
    saveCustomProviders() {
        const customProviders = Array.from(this.providers.values())
            .filter(p => p.isCustom);
        this.context.globalState.update('thefuse.customLLMProviders', customProviders);
        this.log(`Saved ${customProviders.length} custom providers to extension storage`);
    }
    /**
     * Show quick pick to select a provider
     */
    async showProviderSelectionQuickPick() {
        const providerItems = Array.from(this.providers.values()).map(provider => ({
            label: provider.name,
            description: provider.isDefault ? '(Default)' : '',
            detail: `Provider: ${provider.provider}, Model: ${provider.modelName}`,
            provider
        }));
        const selectedItem = await vscode.window.showQuickPick(providerItems, {
            placeHolder: 'Select LLM Provider',
            title: 'The New Fuse: Select LLM Provider'
        });
        if (selectedItem) {
            this.selectProvider(selectedItem.provider.id);
            vscode.window.showInformationMessage(`Selected LLM provider: ${selectedItem.provider.name}`);
        }
    }
    /**
     * Show quick pick to add a custom provider
     */
    async showAddCustomProviderQuickPick() {
        const providerTypes = [
            { label: 'OpenAI', id: lm_api_bridge_1.LLMProvider.OpenAI },
            { label: 'Anthropic', id: lm_api_bridge_1.LLMProvider.Anthropic },
            { label: 'Ollama', id: lm_api_bridge_1.LLMProvider.Ollama },
            { label: 'Custom', id: lm_api_bridge_1.LLMProvider.Custom }
        ];
        const selectedType = await vscode.window.showQuickPick(providerTypes, {
            placeHolder: 'Select Provider Type',
            title: 'The New Fuse: Add Custom LLM Provider'
        });
        if (!selectedType) {
            return;
        }
        const name = await vscode.window.showInputBox({
            prompt: 'Enter a name for this provider',
            placeHolder: 'e.g. My GPT-4',
            title: 'Provider Name'
        });
        if (!name) {
            return;
        }
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your API key',
            password: true,
            title: 'API Key'
        });
        if (!apiKey) {
            return;
        }
        let modelName = '';
        if (selectedType.id === lm_api_bridge_1.LLMProvider.OpenAI) {
            const models = [
                { label: 'GPT-4', id: 'gpt-4' },
                { label: 'GPT-4 Turbo', id: 'gpt-4-turbo' },
                { label: 'GPT-3.5 Turbo', id: 'gpt-3.5-turbo' },
                { label: 'GPT-4o', id: 'gpt-4o' }
            ];
            const selectedModel = await vscode.window.showQuickPick(models, {
                placeHolder: 'Select Model',
                title: 'OpenAI Model'
            });
            if (!selectedModel) {
                return;
            }
            modelName = selectedModel.id;
        }
        else if (selectedType.id === lm_api_bridge_1.LLMProvider.Anthropic) {
            const models = [
                { label: 'Claude 3 Opus', id: 'claude-3-opus-20240229' },
                { label: 'Claude 3 Sonnet', id: 'claude-3-sonnet-20240229' },
                { label: 'Claude 3 Haiku', id: 'claude-3-haiku-20240307' }
            ];
            const selectedModel = await vscode.window.showQuickPick(models, {
                placeHolder: 'Select Model',
                title: 'Anthropic Model'
            });
            if (!selectedModel) {
                return;
            }
            modelName = selectedModel.id;
        }
        else {
            modelName = await vscode.window.showInputBox({
                prompt: 'Enter model name',
                placeHolder: 'e.g. mistral-7b-instruct',
                title: 'Model Name'
            });
            if (!modelName) {
                return;
            }
        }
        const apiEndpoint = await vscode.window.showInputBox({
            prompt: 'Enter API endpoint (optional)',
            placeHolder: 'e.g. https://api.openai.com/v1',
            title: 'API Endpoint',
            value: selectedType.id === lm_api_bridge_1.LLMProvider.OpenAI ? 'https://api.openai.com/v1' :
                selectedType.id === lm_api_bridge_1.LLMProvider.Anthropic ? 'https://api.anthropic.com' : ''
        });
        const id = `custom-${Date.now()}`;
        const newProvider = {
            id,
            name,
            provider: selectedType.id,
            modelName,
            apiKey,
            apiEndpoint: apiEndpoint || undefined,
            isCustom: true,
            isBuiltin: false
        };
        this.registerProvider(newProvider);
        this.saveCustomProviders();
        // Set as selected provider
        this.selectProvider(id);
        vscode.window.showInformationMessage(`Added custom provider: ${name}`);
    }
    /**
     * Show quick pick to manage providers
     */
    async showManageProvidersQuickPick() {
        const providers = this.getAllProviders();
        const items = providers.map(provider => ({
            label: provider.name,
            description: provider.isDefault ? '(Default)' :
                provider.isBuiltin ? '(Built-in)' :
                    provider.isCustom ? '(Custom)' : '',
            provider
        }));
        items.push({
            label: '+ Add Custom Provider',
            description: '',
            provider: { id: 'add-new', name: '', provider: '', modelName: '' }
        });
        const selectedItem = await vscode.window.showQuickPick(items, {
            placeHolder: 'Manage LLM Providers',
            title: 'The New Fuse: Manage LLM Providers'
        });
        if (!selectedItem) {
            return;
        }
        if (selectedItem.provider.id === 'add-new') {
            this.showAddCustomProviderQuickPick();
            return;
        }
        const options = [
            { label: 'Select', id: 'select' },
            { label: 'Set as Default', id: 'default' }
        ];
        if (selectedItem.provider.isCustom) {
            options.push({ label: 'Delete', id: 'delete' });
        }
        const action = await vscode.window.showQuickPick(options, {
            placeHolder: `Action for ${selectedItem.provider.name}`,
            title: 'Select Action'
        });
        if (!action) {
            return;
        }
        switch (action.id) {
            case 'select':
                this.selectProvider(selectedItem.provider.id);
                vscode.window.showInformationMessage(`Selected provider: ${selectedItem.provider.name}`);
                break;
            case 'default':
                // Update all providers to remove default flag
                for (const provider of providers) {
                    provider.isDefault = false;
                }
                // Set the selected provider as default
                selectedItem.provider.isDefault = true;
                this.saveCustomProviders();
                this.updateStatusBar();
                vscode.window.showInformationMessage(`Set ${selectedItem.provider.name} as default provider`);
                break;
            case 'delete':
                this.removeProvider(selectedItem.provider.id);
                vscode.window.showInformationMessage(`Removed provider: ${selectedItem.provider.name}`);
                break;
        }
    }
    /**
     * Update the status bar item
     */
    updateStatusBar() {
        const selectedProvider = this.getSelectedProvider();
        if (selectedProvider) {
            this.statusBarItem.text = `$(hubot) ${selectedProvider.name}`;
        }
        else {
            this.statusBarItem.text = '$(hubot) Select LLM';
        }
    }
    /**
     * Log a message to the output channel
     */
    log(message) {
        this.outputChannel.appendLine(`[LLMProviderManager] ${message}`);
    }
    /**
     * Initialize a pool of workers for concurrent processing
     */
    initializeWorkerPool() {
        try {
            const workerCount = Math.max(1, Math.min(4, navigator.hardwareConcurrency || 2));
            this.log(`Initializing worker pool with ${workerCount} workers`);
            for (let i = 0; i < workerCount; i++) {
                try {
                    const worker = new Worker('./dist/llm-worker.js');
                    worker.on('message', (data) => {
                        this.handleWorkerMessage(worker, data);
                    });
                    worker.on('error', (error) => {
                        this.log(`Worker error: ${error.message}`);
                    });
                    this.workerPool.push({
                        worker,
                        busy: false,
                        id: `worker-${i}`,
                        lastUsed: Date.now()
                    });
                }
                catch (err) {
                    this.log(`Failed to create worker ${i}: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
        }
        catch (err) {
            this.log(`Failed to initialize worker pool: ${err instanceof Error ? err.message : String(err)}`);
            // Create a fallback worker that just executes on the main thread
            this.workerPool.push({
                worker: null,
                busy: false,
                id: 'main-thread-fallback',
                lastUsed: Date.now()
            });
        }
    }
    /**
     * Handle a message from a worker
     */
    handleWorkerMessage(worker, data) {
        if (data.type === 'completion') {
            // Find the worker in the pool and mark it as not busy
            const workerInfo = this.workerPool.find(w => w.worker === worker);
            if (workerInfo) {
                workerInfo.busy = false;
                workerInfo.lastUsed = Date.now();
            }
            // Cache the response if caching is enabled
            if (data.cacheKey && data.options?.useCache) {
                this.cacheResponse(data.cacheKey, data.response);
            }
            // Record telemetry
            this.recordTelemetry({
                eventName: 'llm.completion',
                provider: data.provider,
                model: data.model,
                promptLength: data.promptLength,
                responseLength: data.response?.text?.length || 0,
                latency: data.latency,
                successful: !data.error
            });
        }
    }
    /**
     * Process the request queue
     */
    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }
        this.isProcessingQueue = true;
        try {
            // Get the next request from the queue
            const request = this.requestQueue.shift();
            if (!request) {
                this.isProcessingQueue = false;
                return;
            }
            // Find an available worker
            const availableWorker = this.workerPool.find(w => !w.busy);
            if (!availableWorker) {
                // No worker available, put the request back in the queue
                this.requestQueue.unshift(request);
                this.isProcessingQueue = false;
                // Try again after a short delay
                setTimeout(() => this.processQueue(), 100);
                return;
            }
            availableWorker.busy = true;
            // Check cache if caching is enabled
            if (request.options.useCache && request.options.cacheKey) {
                const cachedResponse = this.getCachedResponse(request.options.cacheKey);
                if (cachedResponse) {
                    request.resolve(cachedResponse);
                    this.isProcessingQueue = false;
                    this.processQueue();
                    return;
                }
            }
            // Process the request
            try {
                const provider = this.getSelectedProvider();
                if (!provider) {
                    throw new Error('No provider selected');
                }
                const startTime = Date.now();
                let response;
                if (availableWorker.worker) {
                    // Use worker for processing
                    availableWorker.worker.postMessage({
                        type: 'completion',
                        provider: provider,
                        prompt: request.prompt,
                        options: request.options,
                        cacheKey: request.options.cacheKey
                    });
                    // Set up a timeout
                    const timeoutMs = request.options.timeout || 30000;
                    const timeoutId = setTimeout(() => {
                        request.reject(new Error(`Request timed out after ${timeoutMs}ms`));
                    }, timeoutMs);
                    // Wait for the worker to respond
                    availableWorker.worker.once('message', (data) => {
                        clearTimeout(timeoutId);
                        if (data.error) {
                            request.reject(new Error(data.error));
                        }
                        else {
                            request.resolve(data.response);
                        }
                    });
                }
                else {
                    // Fallback to main thread processing
                    switch (provider.provider) {
                        case lm_api_bridge_1.LLMProvider.OpenAI:
                            response = await this.generateOpenAIText(provider, request.prompt, request.options);
                            break;
                        case lm_api_bridge_1.LLMProvider.Anthropic:
                            response = await this.generateAnthropicText(provider, request.prompt, request.options);
                            break;
                        case lm_api_bridge_1.LLMProvider.Copilot:
                            response = await this.generateCopilotText(provider, request.prompt, request.options);
                            break;
                        default:
                            throw new Error(`Unsupported provider type: ${provider.provider}`);
                    }
                    const latency = Date.now() - startTime;
                    // Cache the response if caching is enabled
                    if (request.options.useCache && request.options.cacheKey) {
                        this.cacheResponse(request.options.cacheKey, response);
                    }
                    // Record telemetry
                    this.recordTelemetry({
                        eventName: 'llm.completion',
                        provider: provider.provider,
                        model: provider.modelName,
                        promptLength: request.prompt.length,
                        responseLength: response?.text?.length || 0,
                        latency,
                        successful: true
                    });
                    request.resolve(response);
                }
            }
            catch (error) {
                this.log(`Error processing request: ${error instanceof Error ? error.message : String(error)}`);
                // Handle retries
                if (request.options.retryCount && request.options.retryCount > 0) {
                    this.log(`Retrying request, ${request.options.retryCount} attempts remaining`);
                    this.requestQueue.push({
                        ...request,
                        options: {
                            ...request.options,
                            retryCount: request.options.retryCount - 1
                        }
                    });
                }
                else {
                    request.reject(error);
                }
                // Record telemetry for the error
                this.recordTelemetry({
                    eventName: 'llm.completion.error',
                    provider: this.getSelectedProvider()?.provider || 'unknown',
                    model: this.getSelectedProvider()?.modelName || 'unknown',
                    promptLength: request.prompt.length,
                    error: error instanceof Error ? error.message : String(error),
                    successful: false
                });
            }
        }
        finally {
            this.isProcessingQueue = false;
            // Continue processing the queue
            if (this.requestQueue.length > 0) {
                this.processQueue();
            }
        }
    }
    /**
     * Configure response caching
     */
    setupResponseCaching() {
        // Set up a timer to clean up expired cache entries
        setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.responseCache.entries()) {
                if (entry.expiry < now) {
                    this.responseCache.delete(key);
                }
            }
        }, 60000); // Clean up every minute
    }
    /**
     * Cache a response
     */
    cacheResponse(key, response, ttlMs = 3600000) {
        this.responseCache.set(key, {
            response,
            timestamp: Date.now(),
            expiry: Date.now() + ttlMs
        });
    }
    /**
     * Get a cached response
     */
    getCachedResponse(key) {
        const entry = this.responseCache.get(key);
        if (!entry || entry.expiry < Date.now()) {
            if (entry) {
                this.responseCache.delete(key);
            }
            return null;
        }
        return entry.response;
    }
    /**
     * Record telemetry event
     */
    recordTelemetry(event) {
        this.telemetryEvents.push({
            ...event,
            timestamp: Date.now()
        });
        // Flush telemetry if we have accumulated enough events
        if (this.telemetryEvents.length >= 10) {
            this.flushTelemetry();
        }
    }
    /**
     * Set up telemetry flushing
     */
    setupTelemetry() {
        // Flush telemetry events periodically
        setInterval(() => {
            this.flushTelemetry();
        }, 60000); // Flush every minute
    }
    /**
     * Generate text with the currently selected provider
     */
    async generateText(prompt, options = {}) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                prompt,
                options: {
                    ...options,
                    retryCount: options.retryCount ?? 2,
                    retryDelay: options.retryDelay ?? 1000,
                    timeout: options.timeout ?? 30000
                },
                resolve,
                reject
            });
            this.processQueue();
        });
    }
    /**
     * Generate a chat completion with the currently selected provider
     */
    async generateChatCompletion(messages, options = {}) {
        return new Promise((resolve, reject) => {
            // Convert chat messages to a prompt for the worker
            const prompt = this.convertMessagesToPrompt(messages);
            this.requestQueue.push({
                prompt,
                options: {
                    ...options,
                    retryCount: options.retryCount ?? 2,
                    retryDelay: options.retryDelay ?? 1000,
                    timeout: options.timeout ?? 30000,
                    cacheKey: options.cacheKey || `chat:${JSON.stringify(messages).slice(0, 100)}`
                },
                resolve,
                reject
            });
            this.processQueue();
        });
    }
    /**
     * Generate code with the currently selected provider
     */
    async generateCode(prompt, language, options = {}) {
        // Enhance the prompt with language information
        const enhancedPrompt = `Generate ${language} code for: ${prompt}\nOnly respond with valid ${language} code without explanations.`;
        return this.generateText(enhancedPrompt, {
            ...options,
            systemPrompt: `You are an expert ${language} developer. Generate only valid ${language} code without explanations.`,
            cacheKey: options.cacheKey || `code:${language}:${prompt.slice(0, 100)}`
        });
    }
    /**
     * Helper: Convert chat messages to a prompt string
     */
    convertMessagesToPrompt(messages) {
        return messages.map(msg => {
            const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
            return `${role}: ${msg.content}`;
        }).join('\n\n');
    }
    /**
     * Helper: Generate text with OpenAI
     */
    async generateOpenAIText(provider, prompt, options) {
        // Implementation would call the OpenAI API
        // This is a placeholder that would be implemented with actual API calls
        this.log(`OpenAI text generation with model: ${provider.modelName}`);
        // For now, return mock response
        return {
            text: `[OpenAI ${provider.modelName} would generate a response to: "${prompt.substring(0, 50)}..."]`,
            provider: 'openai',
            model: provider.modelName
        };
    }
    /**
     * Helper: Generate chat completion with OpenAI
     */
    async generateOpenAIChatCompletion(provider, messages, options) {
        // Implementation would call the OpenAI Chat API
        this.log(`OpenAI chat completion with model: ${provider.modelName}`);
        // For now, return mock response
        return {
            text: `[OpenAI ${provider.modelName} would generate a chat response to the provided messages]`,
            provider: 'openai',
            model: provider.modelName
        };
    }
    /**
     * Helper: Generate text with Anthropic
     */
    async generateAnthropicText(provider, prompt, options) {
        // Implementation would call the Anthropic API
        this.log(`Anthropic text generation with model: ${provider.modelName}`);
        // For now, return mock response
        return {
            text: `[Anthropic ${provider.modelName} would generate a response to: "${prompt.substring(0, 50)}..."]`,
            provider: 'anthropic',
            model: provider.modelName
        };
    }
    /**
     * Helper: Generate chat completion with Anthropic
     */
    async generateAnthropicChatCompletion(provider, messages, options) {
        // Implementation would call the Anthropic API with messages
        this.log(`Anthropic chat completion with model: ${provider.modelName}`);
        // For now, return mock response
        return {
            text: `[Anthropic ${provider.modelName} would generate a chat response to the provided messages]`,
            provider: 'anthropic',
            model: provider.modelName
        };
    }
    /**
     * Helper: Generate text with GitHub Copilot
     */
    async generateCopilotText(provider, prompt, options) {
        // Attempt to use the Copilot extension's API
        this.log(`Copilot text generation`);
        try {
            // Try to call VS Code Copilot extension
            const result = await vscode.commands.executeCommand('github.copilot.generate', {
                prompt,
                temperature: options.temperature,
                maxTokens: options.maxTokens
            });
            return {
                text: result?.text || `[GitHub Copilot would generate a response to: "${prompt.substring(0, 50)}..."]`,
                provider: 'github-copilot',
                model: 'copilot'
            };
        }
        catch (error) {
            this.log(`Error calling Copilot API: ${error instanceof Error ? error.message : String(error)}`);
            // Fall back to a mock response
            return {
                text: `[GitHub Copilot would generate a response to: "${prompt.substring(0, 50)}..."]`,
                provider: 'github-copilot',
                model: 'copilot'
            };
        }
    }
}
exports.LLMProviderManager = LLMProviderManager;
/**
 * Create an LLM Provider Manager
 */
function createLLMProviderManager(context, outputChannel) {
    return new LLMProviderManager(context, outputChannel);
}
//# sourceMappingURL=llm-provider-manager.js.map