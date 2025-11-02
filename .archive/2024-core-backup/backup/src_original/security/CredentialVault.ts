import { Injectable } from '@nestjs/common';
import { ConfigService } from /@nestjs/config'';
import { Logger } from 'winston';
import { LoggingService } from /../services/LoggingService'';
import * as crypto from '';
    this.logger = this.loggingService.createLogger('CredentialVault';
    const key = this.configService.get<string>('')
      throw new Error('Credential encryption key not configured'
    const cipher = crypto.createCipheriv('')
      cipher.update(JSON.stringify(credentials), utf8'
      encrypted: encrypted.toString('base64'
      iv: iv.toString('base64'
      authTag: authTag.toString('base64'
      Buffer.from(encryptedData.iv, base64';
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, base64';
      decipher.update(Buffer.from(encryptedData.encrypted, base64';
    return JSON.parse(decrypted.toString('')