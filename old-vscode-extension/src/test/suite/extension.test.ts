import * as assert from 'assert';
import { LLMProvider, LLMProviderInfo } from '../../types/llm.js';
import { LLMProviderManager } from '../../llm/LLMProviderManager.js';
import { getLogger, Logger, LogLevel, ExtensionLogger, initializeLogging, VSCodeLogger } from '../../core/logging.js';

suite('Extension Test Suite', () => {
    const logger = new ExtensionLogger('TestExtension');

    test('LLM Provider Manager Test', async () => {
        const manager = new LLMProviderManager();
        const mockProvider: LLMProvider = {
            id: 'test-provider',
            name: 'Test Provider',
            async generate(prompt: string): Promise<string> {
                return 'test response';
            },
            async isAvailable(): Promise<boolean> {
                return true;
            },
            async getInfo(): Promise<LLMProviderInfo> {
                return {
                    name: 'Test Provider',
                    version: '1.0.0',
                    capabilities: ['text-generation'],
                    models: ['test-model'],
                    maxTokens: 1000,
                    isAvailable: true
                };
            }
        };

        manager.registerProvider(mockProvider);
        const result = await manager.generate('test prompt');
        assert.strictEqual(result, 'test response');
    });

    test('Multiple Provider Test', async () => {
        const manager = new LLMProviderManager();
        const mockProvider: LLMProvider = {
            id: 'test-provider-2',
            name: 'Test Provider 2',
            async generate(prompt: string): Promise<string> {
                return 'test response 2';
            },
            async isAvailable(): Promise<boolean> {
                return true;
            },
            async getInfo(): Promise<LLMProviderInfo> {
                return {
                    name: 'Test Provider 2',
                    version: '1.0.0',
                    capabilities: ['text-generation'],
                    models: ['test-model'],
                    maxTokens: 1000,
                    isAvailable: true
                };
            }
        };

        manager.registerProvider(mockProvider);
        const result = await manager.generate('test prompt');
        assert.strictEqual(result, 'test response 2');
    });
});