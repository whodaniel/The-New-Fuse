import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';
import { LLMProvider, LLMQueryOptions } from '../../types';

/**
 * Ollama LLM Provider
 * Implements communication with locally running Ollama server
 */
export class OllamaProvider implements LLMProvider {
    id = 'ollama';
    name = 'Ollama';
    private baseUrl: string = 'http://localhost:11434';

    constructor(private readonly context: vscode.ExtensionContext) {
        // Load configuration
        this.loadConfiguration();
        
        // Listen for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('theNewFuse.ollama')) {
                    this.loadConfiguration();
                }
            })
        );
    }

    private loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('theNewFuse.ollama');
        this.baseUrl = config.get<string>('url', 'http://localhost:11434');
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Check if Ollama is running by querying the list of models
            const result = await this.makeRequest('/api/tags', 'GET');
            return !!result.models && result.models.length > 0;
        } catch (error) {
            console.error('Ollama availability check failed:', error);
            return false;
        }
    }

    async query(prompt: string, options?: LLMQueryOptions): Promise<string> {
        try {
            const model = options?.model || 'llama2';
            const temperature = options?.temperature || 0.7;
            const maxTokens = options?.maxTokens;
            
            const response = await this.makeRequest('/api/generate', 'POST', {
                model,
                prompt,
                temperature,
                ...(maxTokens && { num_predict: maxTokens }),
                stream: false
            });

            return response.response;
        } catch (error) {
            console.error('Ollama query failed:', error);
            throw new Error(`Failed to query Ollama: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async streamResponse(prompt: string, callback: (chunk: string) => void, options?: LLMQueryOptions): Promise<void> {
        try {
            const model = options?.model || 'llama2';
            const temperature = options?.temperature || 0.7;
            const maxTokens = options?.maxTokens;
            
            let fullResponse = '';
            
            await this.makeStreamingRequest('/api/generate', 'POST', {
                model,
                prompt,
                temperature,
                ...(maxTokens && { num_predict: maxTokens }),
                stream: true
            }, (chunk) => {
                if (chunk.response) {
                    fullResponse += chunk.response;
                    callback(fullResponse);
                }
            });
        } catch (error) {
            console.error('Ollama stream failed:', error);
            throw new Error(`Failed to stream Ollama response: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    private async makeRequest(endpoint: string, method: string, body?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseUrl + endpoint);
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = (url.protocol === 'https:' ? https : http).request(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            const parsedData = JSON.parse(data);
                            resolve(parsedData);
                        } else {
                            reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    }
    
    private async makeStreamingRequest(
        endpoint: string, 
        method: string, 
        body: any, 
        onChunk: (chunk: any) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseUrl + endpoint);
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = (url.protocol === 'https:' ? https : http).request(url, options, (res) => {
                let buffer = '';
                
                res.on('data', (chunk) => {
                    const chunkStr = chunk.toString();
                    buffer += chunkStr;
                    
                    // Process complete JSON objects
                    let newlineIndex;
                    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.substring(0, newlineIndex);
                        buffer = buffer.substring(newlineIndex + 1);
                        
                        if (line.trim()) {
                            try {
                                const data = JSON.parse(line);
                                onChunk(data);
                                
                                // If this is the final chunk
                                if (data.done) {
                                    resolve();
                                    return;
                                }
                            } catch (error) {
                                console.error('Error parsing JSON chunk:', error);
                            }
                        }
                    }
                });
                
                res.on('end', () => {
                    resolve();
                });
                
                res.on('error', (error) => {
                    reject(error);
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.write(JSON.stringify(body));
            req.end();
        });
    }
}
