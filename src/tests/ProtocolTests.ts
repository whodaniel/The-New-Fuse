import { ProtocolHandler } from '../protocols/ProtocolHandler.js';
import { A2AMessage } from '../protocols/types.js';
import { SecurityManager } from '../protocols/SecurityManager.js';

export class ProtocolTestSuite {
    private protocolHandler: ProtocolHandler;
    private securityManager: SecurityManager;

    constructor() {
        this.protocolHandler = new ProtocolHandler();
        this.securityManager = new SecurityManager();
    }

    async testMessageFlow(): Promise<boolean> {
        const testMessage: A2AMessage = {
            type: 'TEST',
            payload: { data: 'test' },
            metadata: {
                timestamp: Date.now(),
                sender: 'test-suite',
                protocol_version: '1.0'
            }
        };

        try {
            await this.protocolHandler.initialize();
            await this.protocolHandler.sendMessage('test-target', testMessage);
            return true;
        } catch (error) {
            console.error('Message flow test failed:', error);
            return false;
        }
    }

    async testSecurityLayer(): Promise<boolean> {
        const payload = { sensitive: 'data' };
        try {
            const encrypted = await this.securityManager.encryptPayload(payload);
            const decrypted = await this.securityManager.decryptPayload(encrypted);
            return JSON.stringify(payload) === JSON.stringify(decrypted);
        } catch (error) {
            console.error('Security layer test failed:', error);
            return false;
        }
    }
}