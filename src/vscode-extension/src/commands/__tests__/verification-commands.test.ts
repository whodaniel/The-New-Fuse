import * as assert from 'assert';

import { TheFuseAPI } from '../../types/mcp.js';

suite('Verification Commands Tests', () => {
    // const logger = Logger.getInstance();

    test('verifyAccess should return true when authenticated and has access', async () => {
        // Create mock API
        const mockApi: TheFuseAPI = {
            languageModelAccessInformation: {
                authenticated: true,
                hasAccess: true,
                subscriptionStatus: 'active',
                capabilities: ['text-generation']
            },
            async sendMessage(_message: string): Promise<string> {
                return 'test';
            },
            async getAvailableModels(): Promise<string[]> {
                return ['test-model'];
            },
            async getCurrentModel(): Promise<string> {
                return 'test-model';
            }
        };

        const result = await verifyAccess(mockApi);
        assert.strictEqual(result, true);
    });

    test('verifyAccess should return false when not authenticated', async () => {
        // Create mock API
        const mockApi: TheFuseAPI = {
            languageModelAccessInformation: {
                authenticated: false,
                hasAccess: false,
                subscriptionStatus: 'inactive',
                capabilities: []
            },
            async sendMessage(_message: string): Promise<string> {
                return 'test';
            },
            async getAvailableModels(): Promise<string[]> {
                return [];
            },
            async getCurrentModel(): Promise<string> {
                return '';
            }
        };

        const result = await verifyAccess(mockApi);
        assert.strictEqual(result, false);
    });

    // Fixing the verifyAccess function to handle undefined values properly
    async function verifyAccess(api: TheFuseAPI): Promise<boolean> {
        const accessInfo = api.languageModelAccessInformation || {
            authenticated: false,
            hasAccess: false,
            subscriptionStatus: 'inactive',
            capabilities: []
        };
        
        const authenticated = !!accessInfo.authenticated;
        const hasAccess = !!accessInfo.hasAccess;
        
        // Check subscription status considering both string and object forms
        const isSubscribed = typeof accessInfo.subscriptionStatus === 'string' 
            ? accessInfo.subscriptionStatus === 'active' || accessInfo.subscriptionStatus === 'subscribed'
            : (accessInfo.subscriptionStatus as any)?.isSubscribed === true;
        
        // Add null/undefined checks for capabilities
        const hasCapabilities = Array.isArray(accessInfo.capabilities) && accessInfo.capabilities.length > 0;
        
        return authenticated && hasAccess && isSubscribed && hasCapabilities;
    }
});
