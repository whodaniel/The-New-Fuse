import { createCipheriv, createDecipheriv, randomBytes, CipherGCMTypes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { EncryptionError } from './errors/EncryptionError';

@Injectable()
export class EncryptionService {
    private readonly algorithm: CipherGCMTypes = 'aes-256-gcm';
    private readonly keyLength = 32;
    private readonly ivLength = 16;

    constructor() {
        // Logger functionality removed for now
    }

    async encrypt(data: string, key: Buffer): Promise<{ encryptedData: Buffer; iv: Buffer; authTag: Buffer }> {
        try {
            const iv = randomBytes(this.ivLength);
            const cipher = createCipheriv(this.algorithm, key, iv);
            
            const encryptedData = Buffer.concat([
                cipher.update(data, 'utf8'),
                cipher.final()
            ]);

            return {
                encryptedData,
                iv,
                authTag: cipher.getAuthTag()
            };
        } catch (error) {
            // this.logger.error('Encryption failed:', error);
            console.error('Encryption failed:', error);
            throw new EncryptionError('Failed to encrypt data');
        }
    }

    async decrypt(encryptedData: Buffer, key: Buffer, iv: Buffer, authTag: Buffer): Promise<string> {
        try {
            const decipher = createDecipheriv(this.algorithm, key, iv);
            decipher.setAuthTag(authTag);

            const decrypted = Buffer.concat([
                decipher.update(encryptedData),
                decipher.final()
            ]);

            return decrypted.toString('utf8');
        } catch (error) {
            // this.logger.error('Decryption failed:', error);
            console.error('Decryption failed:', error);
            throw new EncryptionError('Failed to decrypt data');
        }
    }
}
