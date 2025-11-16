import * as vscode from 'vscode';
import { LLMProvider, LLMQueryOptions } from '../../types';

/**
 * OpenAI LLM Provider
 * Implements communication with OpenAI API
 */
export class OpenAIProvider implements LLMProvider {
    id = 'openai';
    name = 'OpenAI';
    private apiKey: string | undefined;

    constructor(private readonly context: vscode.ExtensionContext) {
        // Try to get API key from configuration or extension secrets
        void this.loadAPIKey().catch(err => console.error('Failed to load OpenAI API key:', err));
        
        // Listen for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('theNewFuse.openai')) {
                    void this.loadAPIKey().catch(err => console.error('Failed to reload OpenAI API key:', err));
                }
            })
        );
    }

    private async loadAPIKey(): Promise<void> {
        const config = vscode.workspace.getConfiguration('theNewFuse.openai');
        let key = config.get<string>('apiKey');
        if (!key) {
            key = await this.context.secrets.get('openai-api-key');
        }
        this.apiKey = key;
    }

    async isAvailable(): Promise<boolean> {
        // Check if we have an API key
        if (!this.apiKey) {
            // If API key not found, prompt the user
            const shouldSetup = await vscode.window.showInformationMessage(
                'To use OpenAI as your LLM provider, you need to set up your API key.',
                'Set up now',
                'Later'
            );
            
            if (shouldSetup === 'Set up now') {
                const apiKey = await vscode.window.showInputBox({
                    prompt: 'Enter your OpenAI API Key',
                    password: true,
                    ignoreFocusOut: true
                });
                
                if (apiKey) {
                    // Save the API key
                    await this.context.secrets.store('openai-api-key', apiKey);
                    this.apiKey = apiKey;
                    
                    // Verify the API key works
                    try {
                        const verificationResponse = await fetch('https://api.openai.com/v1/models', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!verificationResponse.ok) {
                            const errorData = await verificationResponse.json();
                            console.error('OpenAI API key verification failed:', errorData);
                            
                            vscode.window.showErrorMessage(
                                `The OpenAI API key could not be verified: ${errorData.error?.message || verificationResponse.statusText}`
                            );
                            return false;
                        }
                        
                        // Key works!
                        vscode.window.showInformationMessage('OpenAI API key verified successfully!');
                        return true;
                    } catch (error) {
                        console.error('Error verifying OpenAI API key:', error);
                        vscode.window.showErrorMessage(
                            `Could not verify the OpenAI API key: ${error instanceof Error ? error.message : String(error)}`
                        );
                        return false;
                    }
                }
                return false;
            }
            return false;
        }
        
        // Verify the existing API key works
        try {
            const verificationResponse = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!verificationResponse.ok) {
                console.error('Existing OpenAI API key verification failed');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error verifying existing OpenAI API key:', error);
            return false;
        }
    }

    async query(prompt: string, options?: LLMQueryOptions): Promise<string> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured. Please set up your API key in the settings.');
        }

        try {
            // Example implementation using fetch (we'd normally use the OpenAI SDK)
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: options?.model || 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: options?.temperature || 0.7,
                    max_tokens: options?.maxTokens || 1000
                })
            });

            if (!response.ok) {
                const error = await response.json();
                const statusCode = response.status;
                
                // Handle different OpenAI error status codes
                switch (statusCode) {
                    case 401:
                        throw new Error('Authentication error: Invalid API key or unauthorized access. Please check your OpenAI API key.');
                    case 429:
                        throw new Error('Rate limit exceeded or quota reached. Please try again later or check your OpenAI plan limits.');
                    case 500:
                    case 503:
                        throw new Error('OpenAI service error. The service might be experiencing issues or undergoing maintenance.');
                    default:
                        throw new Error(`OpenAI API error (${statusCode}): ${error.error?.message || response.statusText}`);
                }
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI query failed:', error);
            
            // Format the error message for better user understanding
            if (error instanceof Error) {
                // If it's already a well-formatted error from our code, pass it through
                throw error;
            } else {
                throw new Error(`Failed to query OpenAI: ${String(error)}`);
            }
        }
    }

    async streamResponse(prompt: string, callback: (chunk: string) => void, options?: LLMQueryOptions): Promise<void> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured. Please set up your API key in the settings.');
        }

        try {
            // Example implementation using fetch for streaming (we'd normally use the OpenAI SDK)
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: options?.model || 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: options?.temperature || 0.7,
                    max_tokens: options?.maxTokens || 1000,
                    stream: true
                })
            });

            if (!response.ok) {
                const error = await response.json();
                const statusCode = response.status;
                
                // Handle different OpenAI error status codes
                switch (statusCode) {
                    case 401:
                        throw new Error('Authentication error: Invalid API key or unauthorized access. Please check your OpenAI API key.');
                    case 429:
                        throw new Error('Rate limit exceeded or quota reached. Please try again later or check your OpenAI plan limits.');
                    case 500:
                    case 503:
                        throw new Error('OpenAI service error. The service might be experiencing issues or undergoing maintenance.');
                    default:
                        throw new Error(`OpenAI API error (${statusCode}): ${error.error?.message || response.statusText}`);
                }
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get response stream');
            }

            let fullResponse = '';
            const decoder = new TextDecoder();
            let hasReceivedContent = false;

            // Set a timeout to prevent hanging if no response comes
            const timeoutMs = 30000; // 30 seconds
            const timeoutPromise = new Promise<void>((_, reject) => {
                setTimeout(() => {
                    if (!hasReceivedContent) {
                        reject(new Error('OpenAI streaming response timed out. Please try again later.'));
                    }
                }, timeoutMs);
            });

            // Process the stream
            const processStreamPromise = (async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {break;}
                        
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n').filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const jsonData = JSON.parse(line.substring(6));
                                    const content = jsonData.choices[0]?.delta?.content || '';
                                    if (content) {
                                        hasReceivedContent = true;
                                        fullResponse += content;
                                        callback(content); // Send incremental chunk, not the full response
                                    }
                                } catch (e) {
                                    // Skip invalid JSON but log it
                                    console.warn('Invalid JSON in OpenAI stream:', e);
                                }
                            }
                        }
                    }
                } catch (streamError) {
                    throw new Error(`Error processing OpenAI stream: ${streamError instanceof Error ? streamError.message : String(streamError)}`);
                }
            })();

            // Wait for either the stream to complete or the timeout to occur
            await Promise.race([processStreamPromise, timeoutPromise]);
            
            // Send empty chunk to signal completion if any content was received
            if (hasReceivedContent) {
                callback('');
            }
        } catch (error) {
            console.error('OpenAI stream failed:', error);
            
            // Format the error message for better user understanding
            let errorMessage: string;
            
            if (error instanceof Error) {
                if (error.message.includes('API key')) {
                    errorMessage = 'Authentication error: Please check your OpenAI API key.';
                } else if (error.message.includes('network') || error.message.includes('connect')) {
                    errorMessage = 'Network error: Please check your internet connection.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Request timed out: OpenAI may be experiencing high traffic or issues.';
                } else {
                    errorMessage = error.message;
                }
            } else {
                errorMessage = `Unknown error: ${String(error)}`;
            }
            
            throw new Error(`Failed to stream OpenAI response: ${errorMessage}`);
        }
    }
}
