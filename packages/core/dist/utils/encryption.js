import * as CryptoJS from 'crypto-js';
import { createCipheriv, createDecipheriv, scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
// Placeholder for a logger utility
const logger = {
    info: (message) => console.log(`[INFO] ${message}`),
    error: (message, error) => console.error(`[ERROR] ${message}`, error),
};
const scryptAsync = promisify(scrypt);
export class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.ivLength = 16;
        this.saltLength = 64;
        this.keyLength = 32;
    }
    async encrypt(text, secret) {
        try {
            const salt = randomBytes(this.saltLength);
            const key = (await scryptAsync(secret, salt, this.keyLength));
            const iv = randomBytes(this.ivLength);
            const cipher = createCipheriv(this.algorithm, key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        }
        catch (error) {
            logger.error('Encryption error:', error);
            throw new Error('Encryption failed');
        }
    }
    async decrypt(encryptedText, secret) {
        try {
            const parts = encryptedText.split(':');
            if (parts.length !== 4) {
                throw new Error('Invalid encrypted message format');
            }
            const salt = Buffer.from(parts[0], 'hex');
            const iv = Buffer.from(parts[1], 'hex');
            const authTag = Buffer.from(parts[2], 'hex');
            const encrypted = parts[3];
            const key = (await scryptAsync(secret, salt, this.keyLength));
            const decipher = createDecipheriv(this.algorithm, key, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            logger.error('Decryption error:', error);
            throw new Error('Decryption failed');
        }
    }
    async hash(text) {
        return CryptoJS.SHA256(text).toString();
    }
    async compareHash(text, hash) {
        const hashedText = await this.hash(text);
        return hashedText === hash;
    }
}
//# sourceMappingURL=encryption.js.map