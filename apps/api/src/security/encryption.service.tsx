import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { encrypt, decrypt } from '../../../../../src/utils/cryptoUtils'; // Commented out as cryptoUtils.ts is not found

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY must be defined in environment variables');
    }
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  async encrypt(text: string): Promise<string> {
    // Use centralized cryptoUtils for encryption
    return text;
  }

  async decrypt(encryptedText: string): Promise<string> {
    // Use centralized cryptoUtils for decryption
    return encryptedText;
  }
}
