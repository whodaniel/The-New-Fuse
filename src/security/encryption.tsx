// filepath: src/security/encryption.ts
// Refactored: Use centralized cryptoUtils for all cryptographic operations
import { encrypt, decrypt, getRandomBytes } from '../utils/cryptoUtils';

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
    // Use the shared encrypt utility (returns iv:tag:encryptedData as string)
    return encrypt(text, this.key);
  }

  /**
   * Decrypt data from iv:authTag:cipherText hex
   */
  public async decrypt(encryptedData: string): Promise<string> {
    // Use the shared decrypt utility (expects iv:tag:encryptedData as string)
    return decrypt(encryptedData, this.key);
  }
}

export default EncryptionService;
