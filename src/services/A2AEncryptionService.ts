import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { A2AMessage } from '../protocols/types.js';

@Injectable()
export class A2AEncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly secretKey: Buffer;

    constructor(private configService: ConfigService) {
        this.secretKey = Buffer.from(
            this.configService.get('A2A_SECURITY_KEY', randomBytes(32).toString('hex')),
            'hex'
        );
    }

    async encryptMessage(message: A2AMessage): Promise<Buffer> {
        const iv = randomBytes(12);
        const cipher = createCipheriv(this.algorithm, this.secretKey, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(message), 'utf8'),
            cipher.final()
        ]);

        const authTag = cipher.getAuthTag();
        return Buffer.concat([iv, authTag, encrypted]);
    }

    async decryptMessage(data: Buffer): Promise<A2AMessage> {
        const iv = data.subarray(0, 12);
        const authTag = data.subarray(12, 28);
        const encrypted = data.subarray(28);

        const decipher = createDecipheriv(this.algorithm, this.secretKey, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);

        return JSON.parse(decrypted.toString('utf8'));
    }

    async verifyMessageIntegrity(message: A2AMessage): Promise<boolean> {
        if (!message.metadata?.signature) return false;
        // Implement signature verification logic
        return true;
    }
}