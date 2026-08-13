import { Injectable } from '@nestjs/common';
import { EncryptionError } from './errors/EncryptionError.js';
import { decrypt, encrypt } from './utils/cryptoUtils.js';

@Injectable()
export class EncryptionService {
  // Algorithm, keyLength, ivLength are now managed by cryptoUtils

  constructor() {
    // Logger functionality removed for now
  }

  async encrypt(data: string, key: Buffer): Promise<string> {
    try {
      return encrypt(data, key);
    } catch {
      throw new EncryptionError('Failed to encrypt data');
    }
  }

  async decrypt(encryptedText: string, key: Buffer): Promise<string> {
    try {
      return decrypt(encryptedText, key);
    } catch {
      throw new EncryptionError('Failed to decrypt data');
    }
  }
}
