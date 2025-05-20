import * as vscode from 'vscode';
import { getLogger, Logger } from '../src/core/logging.js';
import { LLMProviderManager } from '../llm-provider-manager.js';

/**
 * Unified LLM Orchestrator that consolidates functionality from:
 * - llm-orchestrator.tsx
 * - llm-orchestrator-simple.ts
 * - lm-api-bridge.tsx
 * - lm-api-bridge-simple.tsx
 */
export class UnifiedLLMOrchestrator {
    private logger: Logger;
    private llmProviderManager: LLMProviderManager;
    private disposables: vscode.Disposable[] = [];
    private worker: Worker | null = null;
    private pendingRequests: Map<string, { 
        resolve: (value: any) => void, 
        reject: (reason: any) => void 
    }> = new Map();
    private cacheEnabled: boolean = true;
    private cache: Map<string, any> = new Map();
    private statusBarItem: vscode.StatusBarItem;
    
    constructor(llmProviderManager: LLMProviderManager) {
        this.logger = Logger.getInstance();
        this.llmProviderManager = llmProviderManager;
        
        // Create status bar item for LLM operations
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 96);
        this.statusBarItem.text = '$(sync) LLM: Ready';
        this.statusBarItem.tooltip = 'LLM Processing Status';
        this.statusBarItem.show();
        
        // Initialize the worker for background processing
        this.initializeWorker();
        
        // Register commands
        this.registerCommands();
        
        // Load cache from storage if available
        this.loadCache();
    }
    
    /**
     * Initialize the worker for background LLM processing
     */
    private initializeWorker() {
        try {
            // Create a worker from the llm-worker.js file
            const workerContent = `
            // Worker for LLM processing
            self.onmessage = async (event) => {
                const { requestId, action, payload } = event.data;
                
                try {
                    let result;
                    
                    switch (action) {
                        case 'generateText':
                            result = await generateText(payload.prompt, payload.options);
                            break;
                        case 'generateCode':
                            result = await generateCode(payload.prompt, payload.language, payload.options);
                            break;
                        case 'optimizeCode':
                            result = await optimizeCode(payload.code, payload.language, payload.options);
                            break;
                        case 'answerQuestion':
                            result = await answerQuestion(payload.question, payload.context, payload.options);
                            break;
                        default:
                            throw new Error(\`Unknown action: \${action}\`);
                    }
                    
                    self.postMessage({ requestId, success: true, result });
                } catch (error) {
                    self.postMessage({ 
                        requestId, 
                        success: false, 
                        error: { message: error.message, stack: error.stack } 
                    });
                }
            };
            
            // Function to generate text with an LLM
            async function generateText(prompt, options = {}) {
                // In the worker, we'd make an API call to the LLM provider
                // For now, we'll simulate a response after a short delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Return a simulated response
                return { text: \`Generated text for prompt: \${prompt}\` };
            }
            
            // Function to generate code with an LLM
            async function generateCode(prompt, language, options = {}) {
                // Simulate code generation
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Return a simulated response
                return { 
                    code: \`// Generated \${language} code for: \${prompt}\\n\\nfunction example() {\\n  console.log("Example code");\\n}\\n\`,
                    explanation: \`This is an example of \${language} code generated based on your prompt: \${prompt}\`
                };
            }
            
            // Function to optimize code with an LLM
            async function optimizeCode(code, language, options = {}) {
                // Simulate code optimization
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Return a simulated response
                return {
                    optimizedCode: code.replace(/function/g, 'async function'),
                    explanation: 'Converted functions to async functions for better performance.',
                    improvements: ['Converted functions to async', 'Added error handling']
                };
            }
            
            // Function to answer a question with an LLM
            async function answerQuestion(question, context, options = {}) {
                // Simulate answering a question
                await new Promise(resolve => setTimeout(resolve, 1200));
                
                // Return a simulated response
                return {
                    answer: \`Answer to: \${question}\\n\${context ? "Based on the provided context." : ""}\`,
                    confidence: 0.85,
                    references: context ? ['Reference from provided context'] : []
                };
            }`;
            
            // Create a blob URL from the worker content
            const blob = new Blob([workerContent], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            
            // Create the worker from the blob URL
            this.worker = new Worker(blobUrl);
            
            // Handle messages from the worker
            this.worker.onmessage = (event) => {
                const { requestId, success, result, error } = event.data;
                
                const pendingRequest = this.pendingRequests.get(requestId);
                if (pendingRequest) {
                    this.pendingRequests.delete(requestId);
                    
                    if (success) {
                        pendingRequest.resolve(result);
                    } else {
                        pendingRequest.reject(new Error(error.message));
                    }
                }
            };
            
            // Handle worker errors
            this.worker.onerror = (error) => {
                this.logger.error('Worker error:', error);
                
                // Reject all pending requests
                for (const [requestId, request] of this.pendingRequests.entries()) {
                    request.reject(new Error('Worker error'));
                    this.pendingRequests.delete(requestId);
                }
                
                // Try to reinitialize the worker
                this.worker = null;
                this.initializeWorker();
            };
            
            this.logger.info('LLM worker initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize LLM worker:', error);
            this.worker = null;
        }
    }
    
    /**
     * Register LLM-related commands
     */
    private registerCommands() {
        // Generate text command
        this.disposables.push(vscode.commands.registerCommand('thefuse.generateText', async () => {
            const prompt = await vscode.window.showInputBox({
                prompt: 'Enter a prompt to generate text',
                placeHolder: 'e.g., "Write a paragraph about artificial intelligence"'
            });
            
            if (!prompt) {
                return;
            }
            
            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Generating text...",
                    cancellable: false
                }, async (progress) => {
                    const result = await this.generateText(prompt);
                    
                    if (result) {
                        // Show the generated text in a webview
                        const panel = vscode.window.createWebviewPanel(
                            'generatedText',
                            'Generated Text',
                            vscode.ViewColumn.One,
                            { enableScripts: true }
                        );
                        
                        panel.webview.html = this.getGeneratedTextHtml(
                            panel.webview,
                            prompt,
                            result.text
                        );
                    }
                });
            } catch (error) {
                this.logger.error('Error generating text:', error);
                vscode.window.showErrorMessage(`Failed to generate text: ${error.message}`);
            }
        }));
        
        // Generate code command
        this.disposables.push(vscode.commands.registerCommand('thefuse.generateCode', async () => {
            const prompt = await vscode.window.showInputBox({
                prompt: 'Enter a prompt to generate code',
                placeHolder: 'e.g., "Create a function that sorts an array of objects by a property"'
            });
            
            if (!prompt) {
                return;
            }
            
            const languages = ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust'];
            
            const language = await vscode.window.showQuickPick(languages, {
                placeHolder: 'Select a programming language'
            });
            
            if (!language) {
                return;
            }
            
            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Generating code...",
                    cancellable: false
                }, async (progress) => {
                    const result = await this.generateCode(prompt, language);
                    
                    if (result) {
                        // Show the generated code in a new editor
                        const document = await vscode.workspace.openTextDocument({
                            language,
                            content: result.code
                        });
                        
                        await vscode.window.showTextDocument(document);
                        
                        // Show explanation if available
                        if (result.explanation) {
                            vscode.window.showInformationMessage(result.explanation);
                        }
                    }
                });
            } catch (error) {
                this.logger.error('Error generating code:', error);
                vscode.window.showErrorMessage(`Failed to generate code: ${error.message}`);
            }
        }));
        
        // Optimize code command
        this.disposables.push(vscode.commands.registerCommand('thefuse.optimizeCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor');
                return;
            }
            
            const document = editor.document;
            let codeToOptimize = '';
            let selection = editor.selection;
            
            // Use selection if available, otherwise use the entire file
            if (!selection.isEmpty) {
                codeToOptimize = document.getText(selection);
            } else {
                codeToOptimize = document.getText();
                selection = new vscode.Selection(
                    0, 0,
                    document.lineCount - 1,
                    document.lineAt(document.lineCount - 1).range.end.character
                );
            }
            
            if (!codeToOptimize.trim()) {
                vscode.window.showWarningMessage('No code selected to optimize');
                return;
            }
            
            const optimizationTypes = [
                { id: 'performance', label: 'Performance', description: 'Optimize code for better performance' },
                { id: 'readability', label: 'Readability', description: 'Improve code readability' },
                { id: 'security', label: 'Security', description: 'Fix security issues in the code' },
                { id: 'memory', label: 'Memory Usage', description: 'Reduce memory usage' },
                { id: 'modernize', label: 'Modernize', description: 'Use more modern language features' }
            ];
            
            const selectedOptimizationType = await vscode.window.showQuickPick(
                optimizationTypes.map(type => ({
                    label: type.label,
                    description: type.description,
                    id: type.id
                })),
                { placeHolder: 'Select optimization type' }
            );
            
            if (!selectedOptimizationType) {
                return;
            }
            
            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Optimizing code...",
                    cancellable: false
                }, async (progress) => {
                    const result = await this.optimizeCode(
                        codeToOptimize,
                        document.languageId,
                        { optimizationType: selectedOptimizationType.id }
                    );
                    
                    if (!result || !result.optimizedCode) {
                        vscode.window.showInformationMessage('Could not optimize code');
                        return;
                    }
                    
                    // Create a webview to preview and apply changes
                    const panel = vscode.window.createWebviewPanel(
                        'codeOptimization',
                        'Code Optimization',
                        vscode.ViewColumn.Beside,
                        { enableScripts: true }
                    );
                    
                    panel.webview.html = this.getCodeOptimizationHtml(
                        panel.webview,
                        codeToOptimize,
                        result.optimizedCode,
                        result.explanation || 'Code optimized for better performance.',
                        result.improvements || [],
                        document.languageId
                    );
                    
                    // Handle messages from the webview
                    panel.webview.onDidReceiveMessage(async message => {
                        if (message.command === 'applyOptimization') {
                            await editor.edit(editBuilder => {
                                editBuilder.replace(selection, message.code);
                            });
                            panel.dispose();
                            vscode.window.showInformationMessage('Optimization applied');
                        }
                    });
                });
            } catch (error) {
                this.logger.error('Error optimizing code:', error);
                vscode.window.showErrorMessage(`Failed to optimize code: ${error.message}`);
            }
        }));
        
        // Answer question command
        this.disposables.push(vscode.commands.registerCommand('thefuse.answerQuestion', async () => {
            const question = await vscode.window.showInputBox({
                prompt: 'Ask a question',
                placeHolder: 'e.g., "How do I implement a binary search algorithm in JavaScript?"'
            });
            
            if (!question) {
                return;
            }
            
            // Ask if the user wants to include editor context
            const includeContext = await vscode.window.showQuickPick(
                [
                    { label: 'Yes', description: 'Include editor context in the question', value: true },
                    { label: 'No', description: 'Do not include editor context', value: false }
                ],
                { placeHolder: 'Include current editor context in the question?' }
            );
            
            if (!includeContext) {
                return;
            }
            
            let context = '';
            
            if (includeContext.value) {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const document = editor.document;
                    
                    // Use selection if available, otherwise use the entire file
                    if (!editor.selection.isEmpty) {
                        context = document.getText(editor.selection);
                    } else {
                        context = document.getText();
                    }
                }
            }
            
            try {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Answering question...",
                    cancellable: false
                }, async (progress) => {
                    const result = await this.answerQuestion(question, context);
                    
                    if (result) {
                        // Show the answer in a webview
                        const panel = vscode.window.createWebviewPanel(
                            'questionAnswer',
                            'Answer',
                            vscode.ViewColumn.One,
                            { enableScripts: true }
                        );
                        
                        panel.webview.html = this.getQuestionAnswerHtml(
                            panel.webview,
                            question,
                            result.answer,
                            result.confidence,
                            result.references
                        );
                    }
                });
            } catch (error) {
                this.logger.error('Error answering question:', error);
                vscode.window.showErrorMessage(`Failed to answer question: ${error.message}`);
            }
        }));
        
        // Toggle cache command
        this.disposables.push(vscode.commands.registerCommand('thefuse.toggleLLMCache', async () => {
            this.cacheEnabled = !this.cacheEnabled;
            
            const newState = this.cacheEnabled ? 'enabled' : 'disabled';
            vscode.window.showInformationMessage(`LLM cache is now ${newState}`);
            
            // Update configuration
            await vscode.workspace.getConfiguration('thefuse').update('llmCacheEnabled', this.cacheEnabled, true);
        }));
        
        // Clear cache command
        this.disposables.push(vscode.commands.registerCommand('thefuse.clearLLMCache', async () => {
            this.cache.clear();
            this.saveCache();
            vscode.window.showInformationMessage('LLM cache cleared');
        }));
    }
    
    /**
     * Generate text using LLM
     */
    public async generateText(prompt: string, options: any = {}): Promise<any> {
        try {
            this.updateStatusBarItem('$(sync~spin) LLM: Generating text');
            
            // Check cache if enabled
            if (this.cacheEnabled) {
                const cacheKey = `text:${prompt}:${JSON.stringify(options)}`;
                const cachedResult = this.cache.get(cacheKey);
                
                if (cachedResult) {
                    this.logger.info('Using cached result for text generation');
                    this.updateStatusBarItem('$(sync) LLM: Ready');
                    return cachedResult;
                }
            }
            
            // Send request to worker
            const result = await this.sendWorkerRequest('generateText', { prompt, options });
            
            // Cache the result
            if (this.cacheEnabled) {
                const cacheKey = `text:${prompt}:${JSON.stringify(options)}`;
                this.cache.set(cacheKey, result);
                this.saveCache();
            }
            
            // Reset status bar
            this.updateStatusBarItem('$(sync) LLM: Ready');
            
            return result;
        } catch (error) {
            this.updateStatusBarItem('$(error) LLM: Error');
            throw error;
        }
    }
    
    /**
     * Generate code using LLM
     */
    public async generateCode(prompt: string, language: string, options: any = {}): Promise<any> {
        try {
            this.updateStatusBarItem('$(sync~spin) LLM: Generating code');
            
            // Check cache if enabled
            if (this.cacheEnabled) {
                const cacheKey = `code:${prompt}:${language}:${JSON.stringify(options)}`;
                const cachedResult = this.cache.get(cacheKey);
                
                if (cachedResult) {
                    this.logger.info('Using cached result for code generation');
                    this.updateStatusBarItem('$(sync) LLM: Ready');
                    return cachedResult;
                }
            }
            
            // Check if we need to use the actual LLM provider instead of the worker
            const useProvider = options.useProvider || false;
            
            let result;
            
            if (useProvider) {
                // Use the LLM provider manager to generate code
                const provider = this.llmProviderManager.getActiveProvider();
                if (!provider) {
                    throw new Error('No active LLM provider');
                }
                
                result = await provider.generateCode(prompt, language, options);
            } else {
                // Send request to worker
                result = await this.sendWorkerRequest('generateCode', { prompt, language, options });
            }
            
            // Cache the result
            if (this.cacheEnabled) {
                const cacheKey = `code:${prompt}:${language}:${JSON.stringify(options)}`;
                this.cache.set(cacheKey, result);
                this.saveCache();
            }
            
            // Reset status bar
            this.updateStatusBarItem('$(sync) LLM: Ready');
            
            return result;
        } catch (error) {
            this.updateStatusBarItem('$(error) LLM: Error');
            throw error;
        }
    }
    
    /**
     * Optimize code using LLM
     */
    public async optimizeCode(code: string, language: string, options: any = {}): Promise<any> {
        try {
            this.updateStatusBarItem('$(sync~spin) LLM: Optimizing code');
            
            // Check cache if enabled
            if (this.cacheEnabled) {
                const cacheKey = `optimize:${code}:${language}:${JSON.stringify(options)}`;
                const cachedResult = this.cache.get(cacheKey);
                
                if (cachedResult) {
                    this.logger.info('Using cached result for code optimization');
                    this.updateStatusBarItem('$(sync) LLM: Ready');
                    return cachedResult;
                }
            }
            
            // Send request to worker
            const result = await this.sendWorkerRequest('optimizeCode', { code, language, options });
            
            // Cache the result
            if (this.cacheEnabled) {
                const cacheKey = `optimize:${code}:${language}:${JSON.stringify(options)}`;
                this.cache.set(cacheKey, result);
                this.saveCache();
            }
            
            // Reset status bar
            this.updateStatusBarItem('$(sync) LLM: Ready');
            
            return result;
        } catch (error) {
            this.updateStatusBarItem('$(error) LLM: Error');
            throw error;
        }
    }
    
    /**
     * Answer a question using LLM
     */
    public async answerQuestion(question: string, context: string = '', options: any = {}): Promise<any> {
        try {
            this.updateStatusBarItem('$(sync~spin) LLM: Answering question');
            
            // Check cache if enabled
            if (this.cacheEnabled) {
                const cacheKey = `question:${question}:${context ? '(with-context)' : ''}:${JSON.stringify(options)}`;
                const cachedResult = this.cache.get(cacheKey);
                
                if (cachedResult) {
                    this.logger.info('Using cached result for question answering');
                    this.updateStatusBarItem('$(sync) LLM: Ready');
                    return cachedResult;
                }
            }
            
            // Send request to worker
            const result = await this.sendWorkerRequest('answerQuestion', { question, context, options });
            
            // Cache the result
            if (this.cacheEnabled) {
                const cacheKey = `question:${question}:${context ? '(with-context)' : ''}:${JSON.stringify(options)}`;
                this.cache.set(cacheKey, result);
                this.saveCache();
            }
            
            // Reset status bar
            this.updateStatusBarItem('$(sync) LLM: Ready');
            
            return result;
        } catch (error) {
            this.updateStatusBarItem('$(error) LLM: Error');
            throw error;
        }
    }
    
    /**
     * Send a request to the worker
     */
    private sendWorkerRequest(action: string, payload: any): Promise<any> {
        if (!this.worker) {
            // Try to initialize the worker
            this.initializeWorker();
            
            if (!this.worker) {
                throw new Error('LLM worker not available');
            }
        }
        
        return new Promise((resolve, reject) => {
            const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Store the promise callbacks
            this.pendingRequests.set(requestId, { resolve, reject });
            
            // Send the message to the worker
            this.worker!.postMessage({ requestId, action, payload });
        });
    }
    
    /**
     * Update the status bar item
     */
    private updateStatusBarItem(text: string) {
        this.statusBarItem.text = text;
    }
    
    /**
     * Load cache from storage
     */
    private async loadCache() {
        try {
            // Check if caching is enabled in settings
            const config = vscode.workspace.getConfiguration('thefuse');
            this.cacheEnabled = config.get('llmCacheEnabled', true);
            
            // Get the extension context
            const extension = vscode.extensions.getExtension('thefuse.vscode-extension');
            if (!extension) {
                return;
            }
            
            // Get the global storage path
            const storagePath = extension.extensionPath;
            const fs = require('fs');
            const path = require('path');
            const cachePath = path.join(storagePath, 'llm-cache.json');
            
            // Check if cache file exists
            if (fs.existsSync(cachePath)) {
                const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
                
                // Restore cache
                this.cache = new Map(Object.entries(cacheData));
                
                this.logger.info(`Loaded ${this.cache.size} cached LLM responses`);
            }
        } catch (error) {
            this.logger.error('Failed to load LLM cache:', error);
        }
    }
    
    /**
     * Save cache to storage
     */
    private async saveCache() {
        try {
            // Get the extension context
            const extension = vscode.extensions.getExtension('thefuse.vscode-extension');
            if (!extension) {
                return;
            }
            
            // Get the global storage path
            const storagePath = extension.extensionPath;
            const fs = require('fs');
            const path = require('path');
            const cachePath = path.join(storagePath, 'llm-cache.json');
            
            // Convert Map to object
            const cacheData = Object.fromEntries(this.cache);
            
            // Save to file
            fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
            
            this.logger.info(`Saved ${this.cache.size} cached LLM responses`);
        } catch (error) {
            this.logger.error('Failed to save LLM cache:', error);
        }
    }
    
    /**
     * Generate HTML for generated text
     */
    private getGeneratedTextHtml(webview: vscode.Webview, prompt: string, text: string): string {
        const cspSource = webview.cspSource;
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource};">
            <title>Generated Text</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    line-height: 1.6;
                }
                h1, h2 {
                    color: var(--vscode-editor-foreground);
                }
                .prompt {
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    border-left: 4px solid var(--vscode-activityBarBadge-background);
                }
                .generated-text {
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    border-radius: 5px;
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            <h1>Generated Text</h1>
            
            <h2>Prompt</h2>
            <div class="prompt">${this.escapeHtml(prompt)}</div>
            
            <h2>Response</h2>
            <div class="generated-text">${this.escapeHtml(text)}</div>
        </body>
        </html>`;
    }
    
    /**
     * Generate HTML for code optimization
     */
    private getCodeOptimizationHtml(
        webview: vscode.Webview,
        originalCode: string,
        optimizedCode: string,
        explanation: string,
        improvements: string[],
        language: string
    ): string {
        const cspSource = webview.cspSource;
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src ${cspSource};">
            <title>Code Optimization</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    line-height: 1.6;
                }
                h1, h2 {
                    color: var(--vscode-editor-foreground);
                }
                pre {
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    border-radius: 5px;
                    overflow: auto;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                }
                .explanation {
                    margin: 20px 0;
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid var(--vscode-activityBarBadge-background);
                }
                .columns {
                    display: flex;
                    gap: 20px;
                    margin-top: 20px;
                }
                .column {
                    flex: 1;
                }
                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 2px;
                    cursor: pointer;
                    margin-top: 20px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                ul.improvements {
                    padding-left: 20px;
                }
                ul.improvements li {
                    margin-bottom: 4px;
                }
            </style>
        </head>
        <body>
            <h1>Code Optimization</h1>
            
            <div class="explanation">
                <p>${this.escapeHtml(explanation)}</p>
                
                ${improvements.length > 0 ? `
                <h3>Improvements</h3>
                <ul class="improvements">
                    ${improvements.map(improvement => `<li>${this.escapeHtml(improvement)}</li>`).join('')}
                </ul>
                ` : ''}
            </div>
            
            <div class="columns">
                <div class="column">
                    <h2>Original Code</h2>
                    <pre>${this.escapeHtml(originalCode)}</pre>
                </div>
                <div class="column">
                    <h2>Optimized Code</h2>
                    <pre>${this.escapeHtml(optimizedCode)}</pre>
                </div>
            </div>
            
            <button id="applyBtn">Apply Optimization</button>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                document.getElementById('applyBtn').addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'applyOptimization',
                        code: ${JSON.stringify(optimizedCode)}
                    });
                });
            </script>
        </body>
        </html>`;
    }
    
    /**
     * Generate HTML for question answer
     */
    private getQuestionAnswerHtml(
        webview: vscode.Webview,
        question: string,
        answer: string,
        confidence: number,
        references: string[]
    ): string {
        const cspSource = webview.cspSource;
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource};">
            <title>Answer</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-editor-foreground);
                    padding: 20px;
                    line-height: 1.6;
                }
                h1, h2, h3 {
                    color: var(--vscode-editor-foreground);
                }
                .question {
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    border-left: 4px solid var(--vscode-activityBarBadge-background);
                }
                .answer {
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    border-radius: 5px;
                    white-space: pre-wrap;
                    margin-bottom: 20px;
                }
                .confidence {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 20px;
                }
                .confidence-bar {
                    height: 6px;
                    background-color: var(--vscode-editor-background);
                    border-radius: 3px;
                    margin-top: 5px;
                }
                .confidence-level {
                    height: 100%;
                    background-color: var(--vscode-activityBarBadge-background);
                    border-radius: 3px;
                }
                .references {
                    background-color: var(--vscode-editor-background);
                    padding: 15px;
                    border-radius: 5px;
                }
                .references ul {
                    margin: 0;
                    padding-left: 20px;
                }
            </style>
        </head>
        <body>
            <h1>Answer</h1>
            
            <h2>Question</h2>
            <div class="question">${this.escapeHtml(question)}</div>
            
            <h2>Response</h2>
            <div class="answer">${this.escapeHtml(answer)}</div>
            
            <div class="confidence">
                <span>Confidence: ${Math.round(confidence * 100)}%</span>
                <div class="confidence-bar">
                    <div class="confidence-level" style="width: ${Math.round(confidence * 100)}%;"></div>
                </div>
            </div>
            
            ${references.length > 0 ? `
            <h3>References</h3>
            <div class="references">
                <ul>
                    ${references.map(ref => `<li>${this.escapeHtml(ref)}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </body>
        </html>`;
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    /**
     * Dispose of resources
     */
    public dispose() {
        this.disposables.forEach(d => d.dispose());
        this.statusBarItem.dispose();
        
        // Terminate the worker
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        // Save cache
        this.saveCache();
    }
}

/**
 * Create and initialize the unified LLM orchestrator
 */
export function createUnifiedLLMOrchestrator(llmProviderManager: LLMProviderManager): UnifiedLLMOrchestrator {
    return new UnifiedLLMOrchestrator(llmProviderManager);
}