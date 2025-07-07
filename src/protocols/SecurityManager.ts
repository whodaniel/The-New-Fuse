import { A2AMessage } from './types.js';
// Refactored: Use centralized cryptoUtils for all cryptographic operations
import { encrypt, decrypt, getRandomBytes } from '../utils/cryptoUtils';

export class SecurityManager {
    private readonly secretKey: Buffer;
    private readonly algorithm = 'aes-256-gcm';

    constructor(key?: string) {
        this.secretKey = Buffer.from(key || getRandomBytes(32));
    }

    async validateMessage(message: A2AMessage): Promise<boolean> {
        if (!message.metadata || !message.metadata.timestamp) {
            return false;
        }

        const messageAge = Date.now() - message.metadata.timestamp;
        if (messageAge > 5000) { // 5 second maximum age
            return false;
        }

        return true;
    }

    async encryptPayload(payload: Record<string, any>): Promise<string> {
        // Use the shared encrypt utility (returns iv:tag:encryptedData as string)
        return encrypt(JSON.stringify(payload), this.secretKey);
    }

    async decryptPayload(data: string): Promise<Record<string, any>> {
        // Use the shared decrypt utility (expects iv:tag:encryptedData as string)
        return JSON.parse(decrypt(data, this.secretKey));
    }

    generateToken(): string {
        return getRandomBytes(32).toString('hex');
    }
}