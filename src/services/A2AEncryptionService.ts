import { Injectable } from '@nestjs/common';
// Refactored: Use centralized cryptoUtils for all cryptographic operations
import { encrypt, decrypt, getRandomBytes } from '../utils/cryptoUtils';
import { ConfigService } from '@nestjs/config';
import { A2AMessage } from '../protocols/types.js';

@Injectable()
export class A2AEncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly secretKey: Buffer;

    constructor(private configService: ConfigService) {
        this.secretKey = Buffer.from(
            this.configService.get('A2A_SECURITY_KEY', getRandomBytes(32).toString('hex')),
            'hex'
        );
    }

    async encryptMessage(message: A2AMessage): Promise<string> {
        // Use the shared encrypt utility (returns iv:tag:encryptedData as string)
        return encrypt(JSON.stringify(message), this.secretKey);
    }

    async decryptMessage(data: string): Promise<A2AMessage> {
        // Use the shared decrypt utility (expects iv:tag:encryptedData as string)
        return JSON.parse(decrypt(data, this.secretKey));
    }

    async verifyMessageIntegrity(message: A2AMessage): Promise<boolean> {
        if (!message.metadata?.signature) return false;
        // Implement signature verification logic
        return true;
    }
}