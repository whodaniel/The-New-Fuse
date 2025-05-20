import { A2AMessage } from './types.js';
import * as crypto from 'crypto';

export class SecurityManager {
    private readonly secretKey: Buffer;
    private readonly algorithm = 'aes-256-gcm';

    constructor(key?: string) {
        this.secretKey = Buffer.from(key || crypto.randomBytes(32));
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

    async encryptPayload(payload: Record<string, any>): Promise<Buffer> {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(payload), 'utf8'),
            cipher.final()
        ]);

        const authTag = cipher.getAuthTag();
        return Buffer.concat([iv, authTag, encrypted]);
    }

    async decryptPayload(data: Buffer): Promise<Record<string, any>> {
        const iv = data.subarray(0, 12);
        const authTag = data.subarray(12, 28);
        const encrypted = data.subarray(28);

        const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);

        return JSON.parse(decrypted.toString('utf8'));
    }

    generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}