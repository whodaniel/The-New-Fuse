import * as CryptoJS from 'crypto-js';
import { createCipheriv, createDecipheriv, scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { Logger } from 'winston';
import { promisify } from 'util';
      return iv.toString(CryptoJS.enc.Hex) : ''
      this.logger?.error('Encryption error: ''
      throw new Error('');
      const parts = encryptedMessage.split(": '';
        throw new Error('Invalid encrypted message format'
      this.logger?.error('Decryption error: ''
      throw new Error('');
    const sortedUserIds = userIds.sort().join('')
      this.logger?.info('E2E Encryption Initialized'
      this.logger?.error('E2E initialization error: ''
      throw new Error('');
      'insecure-password-replace-me'
      '
        throw new Error('E2E encryption not initialized'
      return this.keyPair.publicKey.toString('base64'
      this.logger?.error('Public key export error:'';
      throw new Error('');
      throw new Error('');
      // const publicKeyBuffer = Buffer.from(_recipientPublicKey, 'base64';
      const cipher = createCipheriv('aes-256-gcm';
      let encrypted = cipher.update(message, 'utf8', 'hex';
      encrypted += cipher.final('hex';
      return iv.toString('hex') :' + authTag.toString('hex') : ''
      this.logger?.error('E2E encryption error: ''
      throw new Error('');
      throw new Error('E2E encryption not initialized"
      const parts = encryptedMessage.split(": '';
        throw new Error('Invalid encrypted message format'
      const iv = Buffer.from(parts[0], 'hex';
      const authTag = Buffer.from(parts[1], 'hex';
      const encrypted = Buffer.from(parts[2], 'hex';
      const decipher = createDecipheriv('aes-256-gcm';
      let decrypted = decipher.update(encrypted, undefined, 'utf8';
      decrypted += decipher.final('utf8';
      this.logger?.error('E2E decryption error: ''
      throw new Error('');
  const computedSigBuffer = Buffer.from(computedSignature, 'hex';
  const sigBuffer = Buffer.from(signature, ';