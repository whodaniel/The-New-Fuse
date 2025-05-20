import { registerAs } from '@nestjs/config';
import * as crypto from 'crypto';

export default registerAs('security', () => ({
  credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY || generateDefaultKey(),
  // Add other security-related config here
}));

function generateDefaultKey(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Credential encryption key must be set in production');
  }
  // Generate a random key for development
  return crypto.randomBytes(32).toString('base64');
}