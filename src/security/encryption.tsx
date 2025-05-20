// filepath: src/security/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(secretKey: string) {
    // Derive a 32-byte key from secret
    const keyBuf = Buffer.from(secretKey);
    this.key = keyBuf.length >= 32 ? keyBuf.slice(0, 32) : Buffer.concat([keyBuf, Buffer.alloc(32 - keyBuf.length)]);
  }

  /**
   * Encrypt text using AES-256-GCM
   * Returns iv:authTag:cipherText in hex
   */
  public async encrypt(text: string): Promise<string> {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypt data from iv:authTag:cipherText hex
   */
  public async decrypt(encryptedData: string): Promise<string> {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

export default EncryptionService;
