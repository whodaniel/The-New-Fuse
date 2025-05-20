import * as vscode from 'vscode';
import { LLMProviderManager } from '../llm-provider-manager.js';
import { getLogger, Logger } from '../src/core/logging.js';

/**
 * Interface for inline completion items
 */
export interface InlineCompletion {
    text: string;
    range?: {
        startLine: number;
        startCharacter: number;
        endLine: number;
        endCharacter: number;
    };
}

/**
 * Interface for panel completion solutions
 */
export interface PanelSolution {
    code: string;
    score: number; 
}

/**
 * Service that provides code completions functionality
 */
export class CompletionsProvider {
    private logger: Logger;
    private worker: Worker | null = null;
    private nodeWorker: any = null;
    private isNode: boolean = false;
    private pendingRequests: Map<string, { resolve: Function, reject: Function }> = new Map();
    private requestCounter: number = 0;
    
    constructor(private llmProviderManager: LLMProviderManager) {
        this.logger = Logger.getInstance();
        this.initialize();
    }
    
    /**
     * Initialize the completions provider
     */
    private initialize() {
        try {
            // Check if we're in a Node.js environment
            this.isNode = typeof process !== 'undefined' && 
                       typeof process.versions !== 'undefined' && 
                       typeof process.versions.node !== 'undefined';
            
            if (this.isNode) {
                // Node.js environment - use worker_threads
                const { Worker } = require('worker_threads');
                this.nodeWorker = new Worker(`${__dirname}/../llm-worker.js`);
                
                this.nodeWorker.on('message', (data: any) => {
                    this.handleWorkerMessage(data);
                });
                
                this.nodeWorker.on('error', (error: any) => {
                    this.logger.error('LLM worker error:', error);
                    this.rejectAllPendingRequests(error);
                });
                
                this.nodeWorker.on('exit', (code: number) => {
                    if (code !== 0) {
                        this.logger.error(`LLM worker exited with code ${code}`);
                        this.rejectAllPendingRequests(new Error(`Worker exited with code ${code}`));
                    }
                    this.nodeWorker = null;
                });
            } else {
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
        } catch (error) {
            this.logger.error('Failed to initialize CompletionsProvider:', error);
        }
    }
    
    /**
     * Handle messages from the worker
     */
    private handleWorkerMessage(data: any) {
        const pendingRequest = this.pendingRequests.get(data.cacheKey);
        
        if (pendingRequest) {
            if (data.error) {
                pendingRequest.reject(new Error(data.error));
            } else {
                pendingRequest.resolve(data);
            }
            
            this.pendingRequests.delete(data.cacheKey);
        }
    }
    
    /**
     * Reject all pending requests
     */
    private rejectAllPendingRequests(error: Error) {
        for (const request of this.pendingRequests.values()) {
            request.reject(error);
        }
        
        this.pendingRequests.clear();
    }
    
    /**
     * Send a request to the worker
     */
    private async sendRequest(requestData: any): Promise<any> {
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
        } else if (this.worker) {
            this.worker.postMessage(requestData);
        } else {
            throw new Error('Worker not initialized');
        }
        
        return promise;
    }
    
    /**
     * Get inline completions for the current document
     */
    public async getInlineCompletions(
        documentText: string, 
        position: vscode.Position, 
        context: string,
        language: string
    ): Promise<InlineCompletion[]> {
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
        } catch (error) {
            this.logger.error('Error getting inline completions:', error);
            return [];
        }
    }
    
    /**
     * Get multiple solutions for display in a panel
     */
    public async getPanelCompletions(
        documentText: string, 
        position: vscode.Position, 
        context: string,
        language: string
    ): Promise<PanelSolution[]> {
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
        } catch (error) {
            this.logger.error('Error getting panel completions:', error);
            return [];
        }
    }
    
    /**
     * Get code explanation
     */
    public async getCodeExplanation(
        code: string,
        language: string
    ): Promise<any> {
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
        } catch (error) {
            this.logger.error('Error getting code explanation:', error);
            return null;
        }
    }
    
    /**
     * Get code refactoring
     */
    public async getCodeRefactoring(
        code: string,
        language: string,
        instructions: string
    ): Promise<any> {
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
        } catch (error) {
            this.logger.error('Error getting code refactoring:', error);
            return null;
        }
    }
    
    /**
     * Dispose of resources
     */
    public dispose() {
        if (this.isNode && this.nodeWorker) {
            this.nodeWorker.terminate();
            this.nodeWorker = null;
        } else if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        this.pendingRequests.clear();
    }
}