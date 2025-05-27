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
exports.CompletionsProvider = void 0;
const vscode = __importStar(require("vscode"));
const logging_1 = require("../core/logging");
/**
 * Service that provides code completions functionality
 */
class CompletionsProvider {
    constructor(llmProviderManager) {
        this.llmProviderManager = llmProviderManager;
        this.worker = null;
        this.nodeWorker = null;
        this.isNode = false;
        this.pendingRequests = new Map();
        this.requestCounter = 0;
        this.logger = logging_1.Logger.getInstance();
        this.initialize();
    }
    /**
     * Initialize the completions provider
     */
    initialize() {
        try {
            // Check if we're in a Node.js environment
            this.isNode = typeof process !== 'undefined' &&
                typeof process.versions !== 'undefined' &&
                typeof process.versions.node !== 'undefined';
            if (this.isNode) {
                // Node.js environment - use worker_threads
                const { Worker } = require('worker_threads');
                this.nodeWorker = new Worker(`${__dirname}/../llm-worker.js`);
                this.nodeWorker.on('message', (data) => {
                    this.handleWorkerMessage(data);
                });
                this.nodeWorker.on('error', (error) => {
                    this.logger.error('LLM worker error:', error);
                    this.rejectAllPendingRequests(error);
                });
                this.nodeWorker.on('exit', (code) => {
                    if (code !== 0) {
                        this.logger.error(`LLM worker exited with code ${code}`);
                        this.rejectAllPendingRequests(new Error(`Worker exited with code ${code}`));
                    }
                    this.nodeWorker = null;
                });
            }
            else {
                // Browser environment - use Web Worker
                this.worker = new Worker(vscode.Uri.joinPath(vscode.Uri.file(__dirname), '../llm-worker.js').toString());
                this.worker.onmessage = (event) => {
                    this.handleWorkerMessage(event.data);
                };
                this.worker.onerror = (error) => {
                    this.logger.error('LLM worker error:', error);
                    this.rejectAllPendingRequests(error);
                };
            }
            this.logger.info('CompletionsProvider initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize CompletionsProvider:', error);
        }
    }
    /**
     * Handle messages from the worker
     */
    handleWorkerMessage(data) {
        const pendingRequest = this.pendingRequests.get(data.cacheKey);
        if (pendingRequest) {
            if (data.error) {
                pendingRequest.reject(new Error(data.error));
            }
            else {
                pendingRequest.resolve(data);
            }
            this.pendingRequests.delete(data.cacheKey);
        }
    }
    /**
     * Reject all pending requests
     */
    rejectAllPendingRequests(error) {
        for (const request of this.pendingRequests.values()) {
            request.reject(error);
        }
        this.pendingRequests.clear();
    }
    /**
     * Send a request to the worker
     */
    async sendRequest(requestData) {
        const requestId = `req_${Date.now()}_${this.requestCounter++}`;
        requestData.cacheKey = requestId;
        const promise = new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject });
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Request timeout'));
                }
            }, 30000); // 30 second timeout
        });
        // Send the request to the appropriate worker
        if (this.isNode && this.nodeWorker) {
            this.nodeWorker.postMessage(requestData);
        }
        else if (this.worker) {
            this.worker.postMessage(requestData);
        }
        else {
            throw new Error('Worker not initialized');
        }
        return promise;
    }
    /**
     * Get inline completions for the current document
     */
    async getInlineCompletions(documentText, position, context, language) {
        try {
            // Check if completions are enabled
            const config = vscode.workspace.getConfiguration('thefuse');
            const enableCompletions = config.get('enableCompletions', true);
            if (!enableCompletions) {
                return [];
            }
            // Get active LLM provider
            const provider = this.llmProviderManager.getActiveProvider();
            if (!provider) {
                throw new Error('No active LLM provider available');
            }
            // Send request to worker
            const response = await this.sendRequest({
                type: 'inlineCompletion',
                provider,
                document: {
                    text: documentText,
                    language
                },
                position: {
                    line: position.line,
                    character: position.character
                },
                context,
                options: {
                    maxCompletions: 3
                }
            });
            if (response.error) {
                throw new Error(response.error);
            }
            return response.completions || [];
        }
        catch (error) {
            this.logger.error('Error getting inline completions:', error);
            return [];
        }
    }
    /**
     * Get multiple solutions for display in a panel
     */
    async getPanelCompletions(documentText, position, context, language) {
        try {
            // Get active LLM provider
            const provider = this.llmProviderManager.getActiveProvider();
            if (!provider) {
                throw new Error('No active LLM provider available');
            }
            // Send request to worker
            const response = await this.sendRequest({
                type: 'panelCompletion',
                provider,
                document: {
                    text: documentText,
                    language
                },
                position: {
                    line: position.line,
                    character: position.character
                },
                context,
                options: {
                    maxSolutions: 5
                }
            });
            if (response.error) {
                throw new Error(response.error);
            }
            return response.solutions || [];
        }
        catch (error) {
            this.logger.error('Error getting panel completions:', error);
            return [];
        }
    }
    /**
     * Get code explanation
     */
    async getCodeExplanation(code, language) {
        try {
            // Get active LLM provider
            const provider = this.llmProviderManager.getActiveProvider();
            if (!provider) {
                throw new Error('No active LLM provider available');
            }
            // Send request to worker
            const response = await this.sendRequest({
                type: 'codeExplanation',
                provider,
                code,
                language,
                options: {
                    detailed: true
                }
            });
            if (response.error) {
                throw new Error(response.error);
            }
            return response.explanation || null;
        }
        catch (error) {
            this.logger.error('Error getting code explanation:', error);
            return null;
        }
    }
    /**
     * Get code refactoring
     */
    async getCodeRefactoring(code, language, instructions) {
        try {
            // Get active LLM provider
            const provider = this.llmProviderManager.getActiveProvider();
            if (!provider) {
                throw new Error('No active LLM provider available');
            }
            // Send request to worker
            const response = await this.sendRequest({
                type: 'refactoring',
                provider,
                code,
                language,
                instructions,
                options: {
                    includeExplanation: true
                }
            });
            if (response.error) {
                throw new Error(response.error);
            }
            return response.refactored || null;
        }
        catch (error) {
            this.logger.error('Error getting code refactoring:', error);
            return null;
        }
    }
    /**
     * Dispose of resources
     */
    dispose() {
        if (this.isNode && this.nodeWorker) {
            this.nodeWorker.terminate();
            this.nodeWorker = null;
        }
        else if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.pendingRequests.clear();
    }
}
exports.CompletionsProvider = CompletionsProvider;
//# sourceMappingURL=completions-provider.js.map